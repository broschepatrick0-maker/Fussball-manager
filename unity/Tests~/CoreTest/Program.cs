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
            // Pokale zu Saisonbeginn
            var dfb0 = g.CupById("dfb");
            Check(dfb0 != null && dfb0.teams.Count == 64, "DFB-Pokal hat " + (dfb0 == null ? 0 : dfb0.teams.Count) + " Teams");
            Check(g.S.euro.Count == 3 && g.S.euro.All(e => e.teams.Count == 36 && e.mds.Count == e.nmd), "Europapokal: " + string.Join(", ", g.S.euro.Select(e => e.id + ":" + e.teams.Count + "/" + e.mds.Count)));
            Check(g.S.euro.All(e => e.mds.All(md => md.m.Count == 18)), "Europapokal: Spieltag ohne 18 Spiele");
            var inTwo = g.S.euro.SelectMany(e => e.teams).GroupBy(x => x).Where(x => x.Count() > 1).Select(x => g.T(x.Key).name).ToList();
            Check(inTwo.Count == 0, "Verein in zwei Europapokalen: " + string.Join(", ", inTwo.Take(3)));
            int lpWant = Game.Pokal.Keys.Count(vb => g.S.leagues.Where(l => !l.foreign && l.level >= 3).SelectMany(l => l.teams).Count(id => g.T(id).vb == vb && !Game.IsRes(g.T(id).name)) >= 2);
            Check(g.S.cups.Count(c => c.type == "lp") == lpWant, "Landespokale: " + g.S.cups.Count(c => c.type == "lp") + " statt " + lpWant);
            Check(g.S.cups.All(c => c.dates.Count == c.R && c.dates.All(d => d >= 1 && d <= g.S.lastDay)), "Pokaltermine außerhalb der Saison");
            int favCups = g.S.cups.Count(c => c.teams.Contains(fav));
            g.SimToEnd();
            Check(g.S.cups.All(c => c.winner >= 0), "Pokal ohne Sieger: " + string.Join(", ", g.S.cups.Where(c => c.winner < 0).Select(c => c.name).Take(3)));
            Check(g.S.euro.All(e => e.winner >= 0 && e.ko.Count == 5), "Europapokal ohne Sieger");
            foreach (var c in g.S.cups) Check(c.teams.Contains(c.winner), c.name + ": Sieger nicht im Teilnehmerfeld");
            string cupLine = $"DFB-Pokal {g.T(g.CupById("dfb").winner).name} · CL {g.T(g.EuroById("ucl").winner).name} · EL {g.T(g.EuroById("uel").winner).name} · ECL {g.T(g.EuroById("uecl").winner).name} · {g.S.cups.Count} Pokale · Werningshausen in {favCups} Pokal(en), {g.CupGamesOf(fav).Count} Spiele";
            var tab = g.Table(bl);
            Check(tab.All(r => r.sp == 34), "Bundesliga: nicht alle 34 Spiele");
            var sq = g.Squad(tab[0].id);
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
            Console.WriteLine("   " + cupLine);
            if (s == 0) foreach (var line in log.lines.Take(16)) Console.WriteLine("   " + line);
        }
        var lv = g.S.leagues.Where(l => !l.foreign).GroupBy(l => l.level).OrderBy(x => x.Key).Select(x => $"{x.Key}:{x.SelectMany(l => l.teams).Average(id => g.T(id).r):0.0}");
        Console.WriteLine("Ø Stärke je Stufe: " + string.Join(" ", lv));
        int titles = g.S.titles.Count; var top = g.S.titles.Where(t => t.kind != "liga" || t.lv <= 2).GroupBy(t => t.team).OrderByDescending(x => x.Count()).Take(3).Select(x => g.T(x.Key).name + " " + x.Count());
        Console.WriteLine($"Titel gesamt: {titles} · meiste große Titel: {string.Join(", ", top)}");
        Check(g.S.titles.Count(t => t.kind == "dfb") == seasons, "DFB-Pokal-Titel: " + g.S.titles.Count(t => t.kind == "dfb"));
        // Speichern und Laden
        string json = JsonSerializer.Serialize(g.S, o);
        var s2 = JsonSerializer.Deserialize<GameState>(json, o);
        var g2 = Game.FromState(s2, n); g2.NextDay();
        Check(g2.S.cups.Count == g.S.cups.Count && g2.S.euro.Count == 3, "Laden: Pokale fehlen");
        // Spielstand aus Phase 1 (ohne Pokale) wird ergänzt
        var old = JsonSerializer.Deserialize<GameState>(json, o); old.cups = new List<Cup>(); old.euro = new List<Euro>();
        var g3 = Game.FromState(old, n); Check(g3.S.cups.Count > 100 && g3.S.euro.Count == 3, "Migration: Pokale nicht angelegt");
        Check(g2.S.day == 1, "Laden: Spieltag " + g2.S.day);
        Console.WriteLine($"Spielstand: {json.Length / 1024} KB, {g.S.players.Count} Spieler");
        Console.WriteLine(fails == 0 ? "ALLES OK" : fails + " FEHLER");
        return fails == 0 ? 0 : 1;
    }
}
