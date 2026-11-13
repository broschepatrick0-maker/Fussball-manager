using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using FP.Core;

static class Program
{
    static int fails = 0;
    static void Check(bool ok, string msg) { if (!ok) { fails++; Console.WriteLine("FEHLER: " + msg); } }
    static int Main(string[] args)
    {
        string data = Path.Combine(AppContext.BaseDirectory, "../../../../../Assets/Resources/Data/");
        var o = new JsonSerializerOptions { IncludeFields = true };
        var w = JsonSerializer.Deserialize<WorldDto>(File.ReadAllText(data + "world.json"), o);
        var n = JsonSerializer.Deserialize<NamesDto>(File.ReadAllText(data + "names.json"), o);
        Console.WriteLine($"Welt: {w.teams.Count} Vereine, {w.leagues.Count} Ligen, {w.squads.Count} echte Kader");
        var g = Game.NewGame(w, n, 42);
        int fav = g.S.teams.First(t => t.name == "SV Salamander Werningshausen").id; g.S.fav = fav;
        int seasons = args.Length > 0 ? int.Parse(args[0]) : 10;
        int total0 = g.S.leagues.Sum(l => l.teams.Count);
        for (int s = 0; s < seasons; s++)
        {
            var bl = g.L("bl");
            g.SimToEnd();
            var tab = g.Table(bl);
            Check(tab.All(r => r.sp == 34), "Bundesliga: nicht alle 34 Spiele");
            var sq = g.Squad(tab[0].id);
            Check(g.S.cups.Count > 100, "zu wenige Pokale: " + g.S.cups.Count);
            Check(g.S.cups.All(c => c.winner >= 0), "nicht alle Pokale entschieden");
            var dfb = g.CupById("dfb"); Check(dfb != null && dfb.teams.Count == 64, "DFB-Pokal hat " + (dfb == null ? 0 : dfb.teams.Count) + " Teams");
            if (s == 0) Console.WriteLine($"Pokale: {g.S.cups.Count} · DFB-Pokal-Sieger {g.T(dfb.winner).name} · Werningshausen: {string.Join(", ", g.CupsOf(fav).Select(c => c.name + " " + g.CupReach(c, fav)))}");
            var log = g.EndSeason();
            // Invarianten
            var seen = new Dictionary<int, string>();
            foreach (var l in g.S.leagues) foreach (var id in l.teams) { Check(!seen.ContainsKey(id), $"{g.T(id).name} doppelt ({seen.GetValueOrDefault(id)} / {l.name})"); seen[id] = l.name; }
            int total = g.S.leagues.Sum(l => l.teams.Count) + g.S.parked.Count;
            Check(total == total0, $"Vereinszahl {total0} → {total}");
            foreach (var id in new[] { "bl", "bl2" }) Check(g.L(id).teams.Count == 18, id + " hat " + g.L(id).teams.Count);
            Check(g.L("l3").teams.Count == 20, "3. Liga hat " + g.L("l3").teams.Count);
            var small = g.S.leagues.Where(l => !l.foreign && l.teams.Count < 6).Select(l => l.name + ":" + l.teams.Count).ToList();
            Check(small.Count == 0, "zu kleine Ligen: " + string.Join(", ", small.Take(5)));
            var drift = g.S.leagues.Where(l => !l.foreign && l.tgt > 0 && Math.Abs(l.teams.Count - l.tgt) > 3).Select(l => l.name + ":" + l.teams.Count + "/" + l.tgt).ToList();
            var favL = g.LeagueOf(fav);
            Console.WriteLine($"{log.season}: Meister {g.T(tab[0].id).name} ({tab[0].p} P., Stärke {g.T(tab[0].id).r}) · {log.lines.Count} Meldungen · Ligen mit Abweichung >3: {drift.Count} · Werningshausen: {favL?.name}");
            if (s == 0) foreach (var line in log.lines.Take(12)) Console.WriteLine("   " + line);
        }
        var fz = g.FZ(fav); Check(fz.h.Count >= seasons - 1, "Finanzhistorie fehlt: " + fz.h.Count);
        var bal = g.Balance(fav); Console.WriteLine($"Finanzen Werningshausen: Konto {Util.Money(fz.c)} · Kredite {Util.Money(fz.d)} · Stadion {fz.cap} · Umsatz {Util.Money(bal.rev)} · Ergebnis {Util.Money(bal.res)}");
        var bf = g.Balance(g.L("bl").teams[0]); Console.WriteLine($"Finanzen {g.T(g.L("bl").teams[0]).name}: Umsatz {Util.Money(bf.rev)} · Gehälter {Util.Money(bf.exp[0].Value)} · Ergebnis {Util.Money(bf.res)}");
        var lv = g.S.leagues.Where(l => !l.foreign).GroupBy(l => l.level).OrderBy(x => x.Key).Select(x => $"{x.Key}:{x.SelectMany(l => l.teams).Average(id => g.T(id).r):0.0}");
        Console.WriteLine("Ø Stärke je Stufe: " + string.Join(" ", lv));
        // Speichern und Laden
        string json = JsonSerializer.Serialize(g.S, o);
        var s2 = JsonSerializer.Deserialize<GameState>(json, o);
        var g2 = Game.FromState(s2, n); g2.NextDay();
        Check(g2.S.day == 1, "Laden: Spieltag " + g2.S.day);
        Console.WriteLine($"Spielstand: {json.Length / 1024} KB, {g.S.players.Count} Spieler");
        // Karriere von ganz unten
        var k = Game.NewGame(w, n, 7); k.NewCareer("Testtrainer", -1, "zero");
        Check(k.C.jobless && k.C.offers.Count > 0, "Karrierestart ohne Angebote");
        for (int s = 0; s < 4; s++)
        {
            for (int d = 0; d < 60 && !k.SeasonDone; d++) { if (k.C.jobless && k.C.offers.Count > 0) k.AcceptOffer(0); k.NextDay(); }
            string club = k.C.club >= 0 ? k.T(k.C.club).name + " (" + k.LeagueOf(k.C.club).name + ")" : "ohne Verein";
            Console.WriteLine($"Karriere {k.S.season}: {club} · Ruf {k.C.rep} · Vertrauen {k.C.conf} · Ziel {(k.C.hasGoal ? k.C.goal.label : "-")} · Bilanz {k.C.stats.w}-{k.C.stats.d}-{k.C.stats.l}");
            k.EndSeason();
        }
        Check(k.C.hist.Count + (k.C.club >= 0 ? 1 : 0) > 0, "Karriere ohne Stationen");
        var js = JsonSerializer.Serialize(k.S, o); var k2 = Game.FromState(JsonSerializer.Deserialize<GameState>(js, o), n); Check(k2.IsCareer, "Karriere nach Laden weg");
        Console.WriteLine(fails == 0 ? "ALLES OK" : fails + " FEHLER");
        return fails == 0 ? 0 : 1;
    }
}
