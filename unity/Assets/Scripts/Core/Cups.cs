// Pokale (DFB-Pokal, Landes- und Kreispokale) und Europapokal (Champions League, Europa League, Conference League).
// Übertragen aus der Web-App (06-cups.js, 05-euro.js). Termine sind Spieltage der Saison (1 … S.lastDay).
using System;
using System.Collections.Generic;
using System.Linq;

namespace FP.Core
{
    // Ein Pokal- oder Europapokalspiel von Mein Verein (für Spielplan und Übersicht)
    public class CupGame { public string comp; public string round; public int day; public CupMatch m; public bool neutral; }

    public partial class Game
    {
        public static readonly Dictionary<string, string> Pokal = new Dictionary<string, string> {
            {"BA","bfv-Pokal"},{"BY","Toto-Pokal Bayern"},{"BE","Berliner Landespokal"},{"BB","Landespokal Brandenburg"},{"HB","Bremer Landespokal"},
            {"HH","Hamburger Landespokal"},{"HE","Hessenpokal"},{"MV","Landespokal MV"},{"MR","Mittelrheinpokal"},{"NR","Niederrheinpokal"},
            {"NI","Niedersachsenpokal"},{"RL","Rheinlandpokal"},{"SL","Saarlandpokal"},{"SN","Sachsenpokal"},{"ST","Landespokal Sachsen-Anhalt"},
            {"SH","SHFV-Landespokal"},{"SB","Südbadischer Pokal"},{"SW","Verbandspokal Südwest"},{"TH","Thüringenpokal"},{"WF","Westfalenpokal"},{"WU","WFV-Pokal"} };
        static readonly string[][] EuroDefs = { new[] { "ucl", "Champions League", "CL", "8" }, new[] { "uel", "Europa League", "EL", "8" }, new[] { "uecl", "Conference League", "ECL", "6" } };
        public static readonly string[] KoNames = { "Play-offs", "Achtelfinale", "Viertelfinale", "Halbfinale", "Finale" };

        public static string RoundName(int R, int k)
        {
            int left = R - k;
            return left == 1 ? "Finale" : left == 2 ? "Halbfinale" : left == 3 ? "Viertelfinale" : left == 4 ? "Achtelfinale" : (k + 1) + ". Runde";
        }
        public Cup CupById(string id) { return S.cups.FirstOrDefault(c => c.id == id); }
        public Euro EuroById(string id) { return S.euro.FirstOrDefault(e => e.id == id); }

        // ---------- Termine ----------
        List<int> Spread(int n, double from, double to)
        {
            int D = Math.Max(1, S.lastDay); var r = new List<int>();
            for (int i = 0; i < n; i++)
            {
                double f = n <= 1 ? to : from + (to - from) * i / (n - 1);
                int d = Math.Max(1, Math.Min(D, (int)Math.Round(f * D)));
                if (r.Count > 0 && d <= r[r.Count - 1]) d = Math.Min(D, r[r.Count - 1] + 1);
                r.Add(d);
            }
            return r;
        }

        // ---------- Pokal-Grundlagen ----------
        static int Pow2(int n) { int p = 1; while (p < n) p *= 2; return p; }
        int LvOf(int id) { var l = LeagueOf(id); return l == null ? 1 : l.foreign ? 1 : l.level; }
        // Der klassentiefere Verein hat Heimrecht
        CupMatch Pair(int x, int y)
        {
            int lx = LvOf(x), ly = LvOf(y);
            if (lx > ly) return new CupMatch { h = x, a = y };
            if (ly > lx) return new CupMatch { h = y, a = x };
            return Rng.U() < .5 ? new CupMatch { h = x, a = y } : new CupMatch { h = y, a = x };
        }
        Cup MakeCup(string id, string name, string type, IEnumerable<int> ids0, string vb = "", string kreis = "")
        {
            var ids = ids0.Distinct().ToList(); if (ids.Count < 2) return null;
            int size = Pow2(ids.Count), R = (int)Math.Round(Math.Log(size, 2)), byes = size - ids.Count;
            var sorted = ids.OrderByDescending(x => T(x).r).ToList();
            var first = new CupRound();
            foreach (var x in sorted.Take(byes)) first.m.Add(new CupMatch { h = x, a = -1, w = x, bye = true });
            var rest = sorted.Skip(byes).ToList(); Rng.Shuffle(rest);
            for (int i = 0; i + 1 < rest.Count; i += 2) first.m.Add(Pair(rest[i], rest[i + 1]));
            Rng.Shuffle(first.m);
            var c = new Cup { id = id, name = name, type = type, vb = vb, kreis = kreis, teams = ids, R = R };
            c.rounds.Add(first);
            return c;
        }
        // Elfmeterschießen: erst fünf Schützen, dann bis zur Entscheidung
        static void Penalties(double qa, double qb, out int a, out int b)
        {
            a = 0; b = 0;
            for (int i = 0; i < 5; i++) { if (Rng.U() < qa) a++; if (Rng.U() < qb) b++; }
            while (a == b) { if (Rng.U() < qa) a++; if (Rng.U() < qb) b++; }
        }
        // Ein KO-Spiel mit Verlängerung und Elfmeterschießen
        void PlayKo(CupMatch m, bool neutral)
        {
            var x = Play(m.h, m.a, neutral); m.hg = x[0]; m.ag = x[1];
            if (m.hg == m.ag)
            {
                double rh = T(m.h).r, ra = T(m.a).r;
                m.hg += Rng.Pois(Lam(rh, ra, !neutral) / 3); m.ag += Rng.Pois(Lam(ra, rh, false) / 3); m.et = true;
                if (m.hg == m.ag) { int a, b; Penalties(.74 + (rh - ra) / 400, .74 + (ra - rh) / 400, out a, out b); m.ph = a; m.pa = b; }
            }
            m.w = m.ph >= 0 ? (m.ph > m.pa ? m.h : m.a) : (m.hg > m.ag ? m.h : m.a);
            int r = m.hg > m.ag ? 1 : m.hg < m.ag ? -1 : 0; Form(m.h, r, m.hg - m.ag); Form(m.a, -r, m.ag - m.hg);
        }
        void PlayCupRound(Cup c)
        {
            if (c.winner >= 0 || c.played >= c.rounds.Count) return;
            var rd = c.rounds[c.played]; bool fin = c.played == c.R - 1;
            foreach (var m in rd.m) if (!m.bye && m.w < 0) PlayKo(m, fin && c.type == "dfb");
            c.played++;
            var winners = rd.m.Select(m => m.w).ToList();
            if (c.played >= c.R || winners.Count == 1) { c.winner = winners[0]; return; }
            Rng.Shuffle(winners); var next = new CupRound();
            for (int i = 0; i + 1 < winners.Count; i += 2) next.m.Add(Pair(winners[i], winners[i + 1]));
            c.rounds.Add(next);
        }
        List<int> TeamsWhere(Func<League, bool> f) { return S.leagues.Where(l => !l.foreign && f(l)).SelectMany(l => l.teams).ToList(); }
        static string KvGet(List<KV> l, string k) { var x = l.FirstOrDefault(e => e.k == k); return x == null ? null : x.v; }
        int WinnerFrom(List<KV> l, string k) { var v = KvGet(l, k); int id; return v != null && int.TryParse(v, out id) && id >= 0 && id < S.teams.Count ? id : -1; }

        // ---------- Pokale anlegen (zu Saisonbeginn) ----------
        public void BuildCups()
        {
            S.cups = new List<Cup>();
            // Landespokale: 3. Liga abwärts im Verband ohne Zweitvertretungen; Verbände mit Kreispokalen nur bis zur Bezirksliga + Kreispokalsieger (höchstens ~128 Teams)
            foreach (var code in Pokal.Keys)
            {
                var ids = TeamsWhere(l => l.level >= 3).Where(id => T(id).vb == code && !IsRes(T(id).name)).ToList();
                var kr = S.leagues.Where(l => !l.foreign && !string.IsNullOrEmpty(l.kreis) && l.vb == code).Select(l => l.kreis).Distinct().ToList();
                if (kr.Count > 0 && ids.Count > 64)
                {
                    int cut = 7; List<int> top;
                    do { int c_ = cut; top = TeamsWhere(l => l.level >= 3 && l.level <= c_).Where(id => T(id).vb == code && !IsRes(T(id).name)).ToList(); }
                    while (top.Count + kr.Count > 128 && --cut >= 4);
                    var set = new HashSet<int>(top); var order = new List<int>(top);
                    foreach (var k in kr)
                    {
                        int w = WinnerFrom(S.kpWinners, code + "|" + k);
                        if (w < 0 || IsRes(T(w).name) || set.Contains(w))
                            w = TeamsWhere(l => l.kreis == k && l.vb == code).Where(id => !IsRes(T(id).name) && !set.Contains(id)).OrderByDescending(id => T(id).r).FirstOr(_ => true, -1);
                        if (w >= 0 && set.Add(w)) order.Add(w);
                    }
                    ids = order;
                }
                var cup = MakeCup("lp-" + code, Pokal[code], "lp", ids, code);
                if (cup != null) { cup.dates = Spread(cup.R, .1, .92); S.cups.Add(cup); }
            }
            // Kreispokale
            foreach (var k in S.leagues.Where(l => !l.foreign && !string.IsNullOrEmpty(l.kreis)).Select(l => l.vb + "|" + l.kreis).Distinct().ToList())
            {
                var parts = k.Split('|'); string vb = parts[0], name = parts[1];
                var cup = MakeCup("kp-" + vb + "-" + name, "Kreispokal " + name, "kp", TeamsWhere(l => l.kreis == name && l.vb == vb), vb, name);
                if (cup != null) { cup.dates = Spread(cup.R, .05, .85); S.cups.Add(cup); }
            }
            // DFB-Pokal: 36 Profis + 4 aus der 3. Liga + 24 Amateure (21 Landespokalsieger + je einer aus Bayern, Niedersachsen, Westfalen)
            var l3 = L("l3"); if (l3 == null) return;
            var pros = TeamsWhere(l => l.level <= 2);
            var l3src = S.lastL3.Count > 0 ? S.lastL3 : l3.teams.OrderByDescending(id => T(id).r).ToList();
            var l3ids = l3src.Where(id => !IsRes(T(id).name) && l3.teams.Contains(id)).Take(4).ToList();
            var used = new HashSet<int>(pros.Concat(l3ids));
            var pool = TeamsWhere(l => l.level >= 3).Where(id => !IsRes(T(id).name) && !used.Contains(id)).ToList();
            var am = new List<int>();
            foreach (var code in Pokal.Keys)
            {
                int pick = WinnerFrom(S.lpWinners, code);
                if (pick < 0 || used.Contains(pick) || IsRes(T(pick).name) || LeagueOf(pick) == null)
                    pick = pool.Where(id => T(id).vb == code && !used.Contains(id)).OrderByDescending(id => T(id).r).FirstOr(_ => true, -1);
                if (pick >= 0) { am.Add(pick); used.Add(pick); }
            }
            foreach (var code in new[] { "BY", "NI", "WF" })
            {
                int p = pool.Where(id => T(id).vb == code && !used.Contains(id)).OrderByDescending(id => T(id).r).FirstOr(_ => true, -1);
                if (p >= 0) { am.Add(p); used.Add(p); }
            }
            foreach (var p in pool.Where(id => !used.Contains(id)).OrderByDescending(id => T(id).r)) { if (am.Count >= 24) break; am.Add(p); used.Add(p); }
            var dfb = MakeCup("dfb", "DFB-Pokal", "dfb", pros.Concat(l3ids).Concat(am));
            if (dfb != null) { dfb.dates = Spread(dfb.R, .06, .96); S.cups.Insert(0, dfb); }
        }

        // ---------- Europapokal ----------
        Qual DefaultQual()
        {
            var q = new Qual();
            foreach (var lg in S.leagues.Where(l => l.level == 1))
            {
                var o = lg.teams.OrderByDescending(id => T(id).r).ToList();
                q.ucl.AddRange(o.Take(4)); q.uel.AddRange(o.Skip(4).Take(2)); q.uecl.AddRange(o.Skip(6).Take(2));
            }
            return q;
        }
        public void BuildEuro()
        {
            S.euro = new List<Euro>(); if (S.pool == null || S.pool.Count == 0) return;
            var q = S.hasQual ? S.qual : DefaultQual(); var used = new HashSet<int>();
            var pool = S.pool.Select(id => new KeyValuePair<int, double>(id, T(id).r + Rng.U() * 6)).OrderByDescending(x => x.Value).Select(x => x.Key).ToList();
            foreach (var def in EuroDefs)
            {
                var src = def[0] == "ucl" ? q.ucl : def[0] == "uel" ? q.uel : q.uecl;
                var ids = src.Distinct().Where(id => id >= 0 && id < S.teams.Count && !used.Contains(id)).Take(36).ToList();
                foreach (var id in ids) used.Add(id);
                foreach (var p in pool) { if (ids.Count >= 36) break; if (used.Add(p)) ids.Add(p); }
                int md = int.Parse(def[3]);
                var e = new Euro { id = def[0], name = def[1], shortName = def[2], nmd = md, teams = ids, mds = EuroPairs(ids, md) };
                e.dates = Spread(md, .15, .6).Concat(Spread(5, .66, .97)).ToList();
                S.euro.Add(e);
            }
        }
        List<Round> EuroPairs(List<int> ids, int n)
        {
            for (int tries = 0; tries < 200; tries++)
            {
                var met = new HashSet<long>(); var home = ids.ToDictionary(x => x, x => 0); var mds = new List<Round>(); bool ok = true;
                for (int d = 0; d < n && ok; d++)
                {
                    var left = new List<int>(ids); Rng.Shuffle(left); var md = new Round();
                    while (left.Count > 0)
                    {
                        int a = left[0]; left.RemoveAt(0);
                        int j = left.FindIndex(b => !met.Contains(Key(a, b)) && T(a).cc != T(b).cc);
                        if (j < 0) j = left.FindIndex(b => !met.Contains(Key(a, b)));
                        if (j < 0) { ok = false; break; }
                        int bb = left[j]; left.RemoveAt(j); met.Add(Key(a, bb));
                        bool ah = home[a] <= home[bb]; md.m.Add(ah ? new Match { h = a, a = bb } : new Match { h = bb, a = a }); home[ah ? a : bb]++;
                    }
                    mds.Add(md);
                }
                if (ok) return mds;
            }
            return new List<Round>();
        }
        static long Key(int a, int b) { return a < b ? (long)a * 100000 + b : (long)b * 100000 + a; }

        public List<Row> EuroTable(Euro e)
        {
            var t = e.teams.ToDictionary(id => id, id => new Row { id = id });
            for (int i = 0; i < Math.Min(e.step, Math.Min(e.nmd, e.mds.Count)); i++)
                foreach (var m in e.mds[i].m)
                {
                    if (m.hg < 0) continue; var H = t[m.h]; var A = t[m.a];
                    H.sp++; A.sp++; H.tf += m.hg; H.tg += m.ag; A.tf += m.ag; A.tg += m.hg;
                    if (m.hg > m.ag) { H.s++; A.n++; H.p += 3; } else if (m.hg < m.ag) { A.s++; H.n++; A.p += 3; } else { H.u++; A.u++; H.p++; A.p++; }
                }
            var list = t.Values.ToList();
            list.Sort((x, y) => { int c = y.p.CompareTo(x.p); if (c != 0) return c; c = y.Diff.CompareTo(x.Diff); if (c != 0) return c; c = y.tf.CompareTo(x.tf); if (c != 0) return c; return T(y.id).r.CompareTo(T(x.id).r); });
            return list;
        }
        // a = schlechter gesetzt, b hat das Rückspiel
        EuroTie Tie(int a, int b, bool final)
        {
            var x = new EuroTie { a = a, b = b, final = final };
            if (final)
            {
                x.l1 = new CupMatch { h = a, a = b }; PlayKo(x.l1, true); x.w = x.l1.w; x.ga = x.l1.hg; x.gb = x.l1.ag; return x;
            }
            x.twoLegs = true;
            var m1 = Play(a, b); var m2 = Play(b, a);
            x.l1 = new CupMatch { h = a, a = b, hg = m1[0], ag = m1[1] }; x.l2 = new CupMatch { h = b, a = a, hg = m2[0], ag = m2[1] };
            int r1 = m1[0] > m1[1] ? 1 : m1[0] < m1[1] ? -1 : 0, r2 = m2[0] > m2[1] ? 1 : m2[0] < m2[1] ? -1 : 0;
            Form(a, r1, m1[0] - m1[1]); Form(b, -r1, m1[1] - m1[0]); Form(b, r2, m2[0] - m2[1]); Form(a, -r2, m2[1] - m2[0]);
            x.ga = m1[0] + m2[1]; x.gb = m1[1] + m2[0];
            if (x.ga != x.gb) x.w = x.ga > x.gb ? a : b;
            else { int p, q; Penalties(.75, .75, out p, out q); x.pa = p; x.pb = q; x.w = p > q ? a : b; }
            x.l1.w = x.l2.w = x.w; return x;
        }
        void EuroStep(Euro e)
        {
            if (e.winner >= 0) return;
            if (e.step < e.nmd)
            {
                if (e.step < e.mds.Count) foreach (var m in e.mds[e.step].m) if (m.hg < 0) { var r = Play(m.h, m.a); m.hg = r[0]; m.ag = r[1]; AfterMatch(m); }
                e.step++; return;
            }
            int k = e.step - e.nmd;   // 0 Play-offs, 1 Achtelfinale, 2 Viertelfinale, 3 Halbfinale, 4 Finale
            if (e.teams.Count < 24) { e.step++; if (k >= 4) e.winner = EuroTable(e)[0].id; return; }
            if (k == 0)
            {
                e.seed = EuroTable(e).Select(r => r.id).ToList();
                var ko = new EuroKo { name = KoNames[0] };
                for (int i = 8; i < 16; i++) ko.ties.Add(Tie(e.seed[31 - i], e.seed[i], false));
                e.ko.Add(ko);
            }
            else
            {
                var pairs = new List<int[]>();
                if (k == 1)
                {
                    var top = e.seed.Take(8).ToList(); var po = e.ko[0].ties.Select(t => t.w).ToList(); Rng.Shuffle(top); Rng.Shuffle(po);
                    for (int i = 0; i < 8; i++) pairs.Add(new[] { po[i], top[i] });
                }
                else { var w = e.ko[k - 1].ties.Select(t => t.w).ToList(); Rng.Shuffle(w); for (int i = 0; i + 1 < w.Count; i += 2) pairs.Add(new[] { w[i], w[i + 1] }); }
                var ko = new EuroKo { name = KoNames[k] };
                foreach (var p in pairs) ko.ties.Add(Tie(p[0], p[1], k == 4));
                e.ko.Add(ko);
                if (k == 4) e.winner = ko.ties[0].w;
            }
            e.step++;
        }
        public string EuroReach(Euro e, int id)
        {
            if (!e.teams.Contains(id)) return null;
            if (e.winner == id) return "Sieger";
            for (int k = e.ko.Count - 1; k >= 0; k--) if (e.ko[k].ties.Any(t => t.a == id || t.b == id)) return e.ko[k].name;
            if (e.seed.Count > 0) return "Ligaphase (" + (e.seed.IndexOf(id) + 1) + ".)";
            return "Ligaphase";
        }
        public string CupReach(Cup c, int id)
        {
            if (c.winner == id) return "Sieger";
            int last = -1; for (int k = 0; k < c.rounds.Count; k++) if (c.rounds[k].m.Any(m => !m.bye && (m.h == id || m.a == id))) last = k;
            if (last < 0) return c.teams.Contains(id) ? (c.played == 0 ? "Freilos / 1. Runde" : "Freilos") : null;
            return RoundName(c.R, last);
        }

        // ---------- Tagesablauf ----------
        void CupsDay(int d)
        {
            foreach (var c in S.cups) while (c.winner < 0 && c.played < c.dates.Count && c.dates[c.played] <= d) PlayCupRound(c);
            foreach (var e in S.euro) while (e.winner < 0 && e.step < e.dates.Count && e.dates[e.step] <= d) EuroStep(e);
        }
        void CupsFinish()
        {
            foreach (var c in S.cups) { int g = 0; while (c.winner < 0 && g++ < 20) PlayCupRound(c); }
            foreach (var e in S.euro) { int g = 0; while (e.winner < 0 && g++ < 20) EuroStep(e); }
        }

        // ---------- Saisonende: Sieger, Startplätze, Titel ----------
        void CupsSeasonEnd(Dictionary<string, List<int>> st, List<string> log)
        {
            CupsFinish();
            var dfb = CupById("dfb"); if (dfb != null && dfb.winner >= 0) log.Add("DFB-Pokalsieger: " + T(dfb.winner).name);
            foreach (var e in S.euro) if (e.winner >= 0) log.Add(e.name + ": " + T(e.winner).name);
            S.lpWinners = new List<KV>(); S.kpWinners = new List<KV>();
            foreach (var c in S.cups.Where(x => x.winner >= 0))
            {
                if (c.type == "lp") { S.lpWinners.Add(new KV { k = c.vb, v = c.winner.ToString() }); log.Add(c.name + ": " + T(c.winner).name); }
                if (c.type == "kp") S.kpWinners.Add(new KV { k = c.vb + "|" + c.kreis, v = c.winner.ToString() });
            }
            S.lastL3 = st.ContainsKey("l3") ? new List<int>(st["l3"]) : new List<int>();
            // Europapokal-Startplätze: je Top-Liga 4/2/2, Titelverteidiger der CL und der EL in die CL, ECL-Sieger in die EL
            var q = new Qual();
            foreach (var lg in S.leagues.Where(l => l.level == 1))
            {
                var o = st[lg.id]; q.ucl.AddRange(o.Take(4)); q.uel.AddRange(o.Skip(4).Take(2)); q.uecl.AddRange(o.Skip(6).Take(2));
            }
            var cl = EuroById("ucl"); var el = EuroById("uel"); var ecl = EuroById("uecl");
            if (el != null && el.winner >= 0) q.ucl.Insert(0, el.winner);
            if (cl != null && cl.winner >= 0) q.ucl.Insert(0, cl.winner);
            if (ecl != null && ecl.winner >= 0) q.uel.Insert(0, ecl.winner);
            var seen = new HashSet<int>();
            q.ucl = q.ucl.Where(seen.Add).ToList(); q.uel = q.uel.Where(seen.Add).ToList(); q.uecl = q.uecl.Where(seen.Add).ToList();
            S.qual = q; S.hasQual = true;
            // Titel
            foreach (var l in S.leagues) { var o = st[l.id]; if (o.Count > 0 && l.played > 0) S.titles.Add(new Title { team = o[0], season = S.season, comp = string.IsNullOrEmpty(l.title) ? (l.id == "bl" ? "Deutscher Meister" : "Meister " + l.name) : l.title, kind = "liga", lv = l.foreign ? 1 : l.level }); }
            foreach (var c in S.cups.Where(x => x.winner >= 0)) S.titles.Add(new Title { team = c.winner, season = S.season, comp = c.name, kind = c.type, lv = c.type == "dfb" ? 0 : c.type == "lp" ? 4 : 9 });
            foreach (var e in S.euro.Where(x => x.winner >= 0)) S.titles.Add(new Title { team = e.winner, season = S.season, comp = e.name, kind = e.id, lv = -1 });
        }

        // Titel eines Vereins (neueste zuerst)
        public List<Title> TitlesOf(int team) { return S.titles.Where(t => t.team == team).OrderByDescending(t => t.season).ToList(); }

        // Pokal- und Europapokalspiele eines Vereins in dieser Saison (nach Termin)
        public List<CupGame> CupGamesOf(int team)
        {
            var r = new List<CupGame>();
            foreach (var c in S.cups)
                for (int k = 0; k < c.rounds.Count; k++)
                    foreach (var m in c.rounds[k].m)
                        if (!m.bye && (m.h == team || m.a == team)) r.Add(new CupGame { comp = c.name, round = RoundName(c.R, k), day = k < c.dates.Count ? c.dates[k] : S.lastDay, m = m, neutral = c.type == "dfb" && k == c.R - 1 });
            foreach (var e in S.euro)
            {
                for (int i = 0; i < e.mds.Count; i++)
                    foreach (var m in e.mds[i].m)
                        if (m.h == team || m.a == team) r.Add(new CupGame { comp = e.name, round = (i + 1) + ". Spieltag", day = i < e.dates.Count ? e.dates[i] : S.lastDay, m = new CupMatch { h = m.h, a = m.a, hg = m.hg, ag = m.ag } });
                for (int k = 0; k < e.ko.Count; k++)
                    foreach (var t in e.ko[k].ties)
                    {
                        if (t.a != team && t.b != team) continue; int d = e.nmd + k < e.dates.Count ? e.dates[e.nmd + k] : S.lastDay;
                        r.Add(new CupGame { comp = e.name, round = e.ko[k].name + (t.twoLegs ? " (Hin)" : ""), day = d, m = t.l1, neutral = !t.twoLegs });
                        if (t.twoLegs) r.Add(new CupGame { comp = e.name, round = e.ko[k].name + " (Rück)", day = d, m = t.l2 });
                    }
            }
            return r.OrderBy(x => x.day).ToList();
        }
        // nächster Spieltag, an dem der Verein im Pokal oder Europapokal gefordert ist (oder -1)
        public int NextCupDay(int team)
        {
            int best = -1;
            foreach (var c in S.cups)
            {
                if (c.winner >= 0 || c.played >= c.rounds.Count || c.played >= c.dates.Count) continue;
                if (c.rounds[c.played].m.Any(m => !m.bye && (m.h == team || m.a == team))) { int d = c.dates[c.played]; if (best < 0 || d < best) best = d; }
            }
            foreach (var e in S.euro)
            {
                if (e.winner >= 0 || !e.teams.Contains(team) || e.step >= e.dates.Count) continue;
                bool alive;
                if (e.step < e.nmd) alive = true;
                else if (e.teams.Count < 24) alive = false;
                else if (e.step == e.nmd) { int p = EuroTable(e).FindIndex(r => r.id == team); alive = p >= 8 && p < 24; }      // Play-offs: Plätze 9–24
                else if (e.step == e.nmd + 1) alive = e.seed.Take(8).Contains(team) || e.ko[0].ties.Any(t => t.w == team);     // Achtelfinale
                else alive = e.ko.Count > 0 && e.ko[e.ko.Count - 1].ties.Any(t => t.w == team);
                if (alive) { int d = e.dates[e.step]; if (best < 0 || d < best) best = d; }
            }
            return best;
        }
    }
}
