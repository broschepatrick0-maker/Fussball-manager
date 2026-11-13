// Kern des Spiels ohne Unity-Abhängigkeiten: Welt aufbauen, Spielplan, Spiele simulieren, Tabellen.
// Übertragen aus der Web-App (02-state.js, 03-schedule.js, 04-sim.js, 08b-players.js).
using System;
using System.Collections.Generic;
using System.Linq;

namespace FP.Core
{
    public class Row { public int id; public int sp, s, u, n, tf, tg, p; public int Diff { get { return tf - tg; } } }

    public partial class Game
    {
        public GameState S;
        NamesDto names;
        Dictionary<string, League> lgById = new Dictionary<string, League>();
        Dictionary<int, League> lgOfTeam = new Dictionary<int, League>();
        Dictionary<string, string> region = new Dictionary<string, string>();
        Dictionary<string, string> homeSeed = new Dictionary<string, string>();
        public static readonly string[] ProLeagues = { "bl", "bl2", "l3", "rln", "rlno", "rlw", "rlsw", "rlby" };
        public static readonly string[] RegionalLeagues = { "rln", "rlno", "rlw", "rlsw", "rlby" };

        // ---------- Aufbau ----------
        public static Game NewGame(WorldDto w, NamesDto n, int seed)
        {
            Rng.Seed(seed);
            var g = new Game { names = n, S = new GameState { season = w.season, seed = seed } };
            for (int i = 0; i < w.teams.Count; i++)
            {
                var d = w.teams[i];
                g.S.teams.Add(new Team { id = i, name = d.name, vb = d.vb ?? "", cc = d.cc ?? "", r = d.r, crest = d.crest ?? "", c1 = d.c1 ?? "", c2 = d.c2 ?? "" });
            }
            foreach (var d in w.leagues)
            {
                var l = new League
                {
                    id = d.id, name = d.name, level = d.level, vb = d.vb ?? "", kreis = d.kreis ?? "", up = d.up ?? "",
                    foreign = d.foreign, cc = d.cc ?? "", title = d.title ?? "", teams = new List<int>(d.teams)
                };
                if (!string.IsNullOrEmpty(d.vbs)) l.vbs = d.vbs.Split(',').ToList();
                else if (!string.IsNullOrEmpty(l.vb)) l.vbs.Add(l.vb);
                l.size = l.tgt = l.teams.Count;
                g.S.leagues.Add(l);
            }
            g.S.pool = new List<int>(w.pool ?? new List<int>());
            g.S.region = w.region ?? new List<KV>();
            g.S.homeSeed = w.homeSeed ?? new List<KV>();
            g.Reindex();
            foreach (var sq in w.squads ?? new List<SquadDto>())
            {
                var t = g.S.teams[sq.team];
                foreach (var p in sq.players)
                {
                    var pl = new Player { id = g.S.players.Count, n = p.n, p = p.p, a = p.a, nat = p.nat, s = p.s, no = p.no, real = true };
                    g.S.players.Add(pl); t.squad.Add(pl.id);
                }
            }
            g.StartSeason();
            return g;
        }

        public static Game FromState(GameState s, NamesDto n)
        {
            var g = new Game { S = s, names = n };
            Rng.Seed(s.seed + s.season * 1000 + s.day);
            g.Reindex();
            // Spielstände aus Phase 1 haben noch keine Pokale: jetzt anlegen, verpasste Runden werden am nächsten Spieltag nachgeholt
            if (s.cups == null || s.cups.Count == 0) { s.titles = s.titles ?? new List<Title>(); s.lpWinners = s.lpWinners ?? new List<KV>(); s.kpWinners = s.kpWinners ?? new List<KV>(); s.lastL3 = s.lastL3 ?? new List<int>(); s.qual = s.qual ?? new Qual(); g.BuildCups(); g.BuildEuro(); }
            return g;
        }

        public void Reindex()
        {
            lgById.Clear(); lgOfTeam.Clear(); region.Clear(); homeSeed.Clear();
            foreach (var l in S.leagues) { lgById[l.id] = l; foreach (var id in l.teams) lgOfTeam[id] = l; }
            foreach (var kv in S.region) region[kv.k] = kv.v;
            foreach (var kv in S.homeSeed) if (!homeSeed.ContainsKey(kv.k)) homeSeed[kv.k] = kv.v;
        }

        // ---------- Abfragen ----------
        public Team T(int id) { return S.teams[id]; }
        public League L(string id) { League l; return id != null && lgById.TryGetValue(id, out l) ? l : null; }
        public League LeagueOf(int team) { League l; return lgOfTeam.TryGetValue(team, out l) ? l : null; }
        public League LeagueByName(string name) { return S.leagues.FirstOrDefault(l => l.name == name); }
        public string RegionOf(string vb) { string r; return vb != null && region.TryGetValue(vb, out r) ? r : "rlw"; }
        public bool SeasonDone { get { return S.done; } }
        public int MaxDay { get { return S.lastDay; } }

        // ---------- Saisonstart ----------
        public void StartSeason()
        {
            foreach (var l in S.leagues)
            {
                if (!l.foreign && l.level >= 5)
                    foreach (var id in l.teams) { var t = T(id); if (!t.hm.Any(x => x.k == l.level.ToString())) t.hm.Add(new KV { k = l.level.ToString(), v = l.name }); }
                l.rounds = Schedule(l.teams); l.played = 0;
                foreach (var id in l.teams) T(id).lv = l.level;
            }
            BuildCalendar();
            BuildCups(); BuildEuro();
            S.day = 0; S.done = false;
            Reindex();
        }

        // Doppelrunde nach dem Kreissystem; Rückrunde mit getauschtem Heimrecht
        public static List<Round> Schedule(List<int> ids)
        {
            var t = new List<int>(ids); Rng.Shuffle(t); if (t.Count % 2 == 1) t.Add(-1);
            int n = t.Count; var first = new List<Round>(); var arr = t;
            for (int r = 0; r < n - 1; r++)
            {
                var rd = new Round();
                for (int i = 0; i < n / 2; i++)
                {
                    int a = arr[i], b = arr[n - 1 - i];
                    if (a >= 0 && b >= 0) rd.m.Add((r + i) % 2 == 1 ? new Match { h = b, a = a } : new Match { h = a, a = b });
                }
                first.Add(rd);
                var nx = new List<int> { arr[0], arr[n - 1] }; nx.AddRange(arr.GetRange(1, n - 2)); arr = nx;
            }
            var all = new List<Round>(first);
            foreach (var rd in first) { var r2 = new Round(); foreach (var m in rd.m) r2.m.Add(new Match { h = m.a, a = m.h }); all.Add(r2); }
            return all;
        }

        // Alle Ligen enden am selben Spieltag: kleinere Ligen verteilen ihre Runden über die Saison
        void BuildCalendar()
        {
            int D = Math.Max(1, S.leagues.Max(l => l.rounds.Count));
            S.lastDay = D;
            foreach (var l in S.leagues)
            {
                l.dates = new List<int>(); int n = l.rounds.Count;
                for (int i = 0; i < n; i++) l.dates.Add(n <= 1 ? D : 1 + (int)Math.Round(i * (D - 1) / (double)(n - 1)));
            }
        }

        // ---------- Spiele ----------
        public float EffR(int id) { var t = T(id); return t.r + t.fm * 0.5f + (t.mo - 60) / 15f; }
        public static double Lam(double a, double b, bool home)
        {
            double d = a - b + (home ? 4 : 0);
            return Math.Min(9, Math.Max(.1, (home ? 1.35 : 1.2) * Math.Exp(d / 26)));
        }
        public int[] Play(int h, int a, bool neutral = false)
        {
            double rh = EffR(h) + Rng.Range(-2, 2), ra = EffR(a) + Rng.Range(-2, 2);
            return new[] { Rng.Pois(Lam(rh, ra, !neutral)), Rng.Pois(Lam(ra, rh, false)) };
        }
        void AfterMatch(Match m)
        {
            int r = m.hg > m.ag ? 1 : m.hg < m.ag ? -1 : 0;
            Form(m.h, r, m.hg - m.ag); Form(m.a, -r, m.ag - m.hg);
        }
        void Form(int id, int r, int gd)
        {
            var t = T(id);
            t.fm = (float)Math.Round(t.fm * 0.72 + r * 0.85 + Math.Max(-1, Math.Min(1, gd / 4.0)) * 0.3, 2);
            t.mo = (int)Math.Round(Math.Max(5, Math.Min(100, t.mo + (60 - t.mo) * 0.1 + r * 4 + (Math.Abs(gd) >= 3 ? r * 2 : 0))));
        }
        void PlayRound(League l)
        {
            if (l.played >= l.rounds.Count) return;
            foreach (var m in l.rounds[l.played].m)
            {
                if (m.hg < 0) { var x = Play(m.h, m.a); m.hg = x[0]; m.ag = x[1]; }
                AfterMatch(m);
            }
            l.played++;
        }

        // Ein Spieltag weiter. Gibt true zurück, wenn danach alle Ligen fertig sind.
        public bool NextDay()
        {
            if (S.done) return true;
            int d = ++S.day;
            foreach (var l in S.leagues)
                while (l.played < l.rounds.Count && l.dates[l.played] <= d) PlayRound(l);
            CupsDay(d);
            if (d >= S.lastDay || S.leagues.All(l => l.played >= l.rounds.Count))
            {
                foreach (var l in S.leagues) while (l.played < l.rounds.Count) PlayRound(l);
                CupsFinish();
                S.done = true;
            }
            return S.done;
        }
        public void SimToEnd() { int g = 0; while (!S.done && g++ < 1000) NextDay(); }

        // ---------- Tabelle ----------
        public List<Row> Table(League l)
        {
            var t = new Dictionary<int, Row>();
            foreach (var id in l.teams) t[id] = new Row { id = id };
            for (int r = 0; r < l.played; r++)
                foreach (var m in l.rounds[r].m)
                {
                    Row H, A; if (!t.TryGetValue(m.h, out H) || !t.TryGetValue(m.a, out A) || m.hg < 0) continue;
                    H.sp++; A.sp++; H.tf += m.hg; H.tg += m.ag; A.tf += m.ag; A.tg += m.hg;
                    if (m.hg > m.ag) { H.s++; A.n++; H.p += 3; } else if (m.hg < m.ag) { A.s++; H.n++; A.p += 3; } else { H.u++; A.u++; H.p++; A.p++; }
                }
            var list = t.Values.ToList();
            list.Sort((x, y) =>
            {
                int c = y.p.CompareTo(x.p); if (c != 0) return c;
                c = y.Diff.CompareTo(x.Diff); if (c != 0) return c;
                c = y.tf.CompareTo(x.tf); if (c != 0) return c;
                return string.CompareOrdinal(T(x.id).name, T(y.id).name);
            });
            return list;
        }
        public List<int> Standing(League l) { return Table(l).Select(r => r.id).ToList(); }

        // Spiele eines Vereins in Reihenfolge der Spieltage
        public List<KeyValuePair<int, Match>> FixturesOf(int team)
        {
            var res = new List<KeyValuePair<int, Match>>(); var l = LeagueOf(team); if (l == null) return res;
            for (int r = 0; r < l.rounds.Count; r++) foreach (var m in l.rounds[r].m) if (m.h == team || m.a == team) res.Add(new KeyValuePair<int, Match>(r, m));
            return res;
        }
        public int Zone(League l, int pos, int n)
        {
            // 1 = Aufstieg, 2 = Relegation, -1 = Abstieg, -2 = Relegation unten, 0 = nichts
            if (l.foreign) return pos < 4 ? 1 : 0;
            switch (l.id)
            {
                case "bl": return pos < 4 ? 1 : pos == 15 ? -2 : pos >= 16 ? -1 : 0;
                case "bl2": return pos < 2 ? 1 : pos == 2 ? 2 : pos == 15 ? -2 : pos >= 16 ? -1 : 0;
                case "l3": return pos < 2 ? 1 : pos == 2 ? 2 : pos >= n - 4 ? -1 : 0;
            }
            if (pos == 0) return 1;
            if (l.level >= 8 && pos == 1) return 2;
            if (pos == n - 1) return -1;
            return 0;
        }
    }
}
