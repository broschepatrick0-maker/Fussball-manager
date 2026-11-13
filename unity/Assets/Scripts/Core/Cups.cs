// Pokale: DFB-Pokal, Landespokale der 21 Verbände und Kreispokale. Übertragen aus der Web-App (06-cups.js).
using System;
using System.Collections.Generic;
using System.Linq;

namespace FP.Core
{
    [Serializable] public class CupMatch { public int h; public int a = -1; public int hg = -1; public int ag = -1; public bool et; public int ph = -1; public int pa = -1; public int w = -1; public bool bye; }
    [Serializable] public class CupRound { public List<CupMatch> m = new List<CupMatch>(); }
    [Serializable]
    public class Cup
    {
        public string id, name, type, vb, kreis;
        public List<int> teams = new List<int>();
        public int R, played, winner = -1;
        public List<CupRound> rounds = new List<CupRound>();
        public List<int> dates = new List<int>();
    }

    public partial class Game
    {
        public static readonly Dictionary<string, string> Pokal = new Dictionary<string, string> {
            {"BA","bfv-Pokal"},{"BY","Toto-Pokal Bayern"},{"BE","Berliner Landespokal"},{"BB","Landespokal Brandenburg"},{"HB","Bremer Landespokal"},{"HH","Hamburger Landespokal"},
            {"HE","Hessenpokal"},{"MV","Landespokal MV"},{"MR","Mittelrheinpokal"},{"NR","Niederrheinpokal"},{"NI","Niedersachsenpokal"},{"RL","Rheinlandpokal"},{"SL","Saarlandpokal"},
            {"SN","Sachsenpokal"},{"ST","Landespokal Sachsen-Anhalt"},{"SH","SHFV-Landespokal"},{"SB","Südbadischer Pokal"},{"SW","Verbandspokal Südwest"},{"TH","Thüringenpokal"},{"WF","Westfalenpokal"},{"WU","WFV-Pokal"} };

        public Cup CupById(string id) { return S.cups.FirstOrDefault(c => c.id == id); }
        public static string RoundName(int R, int k) { int left = R - k; return left == 1 ? "Finale" : left == 2 ? "Halbfinale" : left == 3 ? "Viertelfinale" : left == 4 ? "Achtelfinale" : (k + 1) + ". Runde"; }

        static int Pow2(int n) { int p = 1; while (p < n) p *= 2; return p; }
        CupMatch Pair(int x, int y)
        {
            int lx = T(x).lv > 0 ? T(x).lv : 11, ly = T(y).lv > 0 ? T(y).lv : 11;   // klassentieferer Verein hat Heimrecht
            if (lx > ly) return new CupMatch { h = x, a = y }; if (ly > lx) return new CupMatch { h = y, a = x };
            return Rng.U() < .5 ? new CupMatch { h = x, a = y } : new CupMatch { h = y, a = x };
        }
        Cup MakeCup(string id, string name, string type, IEnumerable<int> idsIn, string vb = "", string kreis = "")
        {
            var ids = idsIn.Distinct().ToList(); if (ids.Count < 2) return null;
            int size = Pow2(ids.Count), R = (int)Math.Round(Math.Log(size, 2)), byes = size - ids.Count;
            var sorted = ids.OrderByDescending(x => T(x).r).ToList();
            var first = sorted.Take(byes).Select(x => new CupMatch { h = x, w = x, bye = true }).ToList();
            var rest = sorted.Skip(byes).ToList(); Rng.Shuffle(rest);
            for (int i = 0; i + 1 < rest.Count; i += 2) first.Add(Pair(rest[i], rest[i + 1]));
            Rng.Shuffle(first);
            var c = new Cup { id = id, name = name, type = type, vb = vb, kreis = kreis, teams = ids, R = R };
            c.rounds.Add(new CupRound { m = first });
            return c;
        }

        void PlayCupRound(Cup c)
        {
            if (c.winner >= 0 || c.played >= c.rounds.Count) return;
            var rd = c.rounds[c.played]; bool fin = c.played == c.R - 1;
            foreach (var m in rd.m)
            {
                if (m.bye || m.w >= 0) continue;
                bool neutral = fin && c.type == "dfb";
                var x = Play(m.h, m.a, neutral); m.hg = x[0]; m.ag = x[1];
                if (m.hg == m.ag)
                {
                    double rh = T(m.h).r, ra = T(m.a).r;
                    m.hg += Rng.Pois(Lam(rh, ra, !neutral) / 3); m.ag += Rng.Pois(Lam(ra, rh, false) / 3); m.et = true;
                    if (m.hg == m.ag)
                    {
                        int a = 0, b = 0; double pa = .74 + (rh - ra) / 400, pb = .74 + (ra - rh) / 400;
                        for (int i = 0; i < 5; i++) { if (Rng.U() < pa) a++; if (Rng.U() < pb) b++; }
                        while (a == b) { if (Rng.U() < pa) a++; if (Rng.U() < pb) b++; }
                        m.ph = a; m.pa = b;
                    }
                }
                m.w = m.ph >= 0 ? (m.ph > m.pa ? m.h : m.a) : (m.hg > m.ag ? m.h : m.a);
                AfterMatch(new Match { h = m.h, a = m.a, hg = m.hg, ag = m.ag });
            }
            c.played++;
            var winners = rd.m.Select(m => m.w).ToList();
            if (c.played >= c.R || winners.Count <= 1) { c.winner = winners[0]; return; }
            Rng.Shuffle(winners); var next = new CupRound();
            for (int i = 0; i + 1 < winners.Count; i += 2) next.m.Add(Pair(winners[i], winners[i + 1]));
            c.rounds.Add(next);
        }

        IEnumerable<int> TeamsOf(Func<League, bool> pred) { return S.leagues.Where(pred).SelectMany(l => l.teams); }

        void BuildCups()
        {
            S.cups = new List<Cup>();
            var kw = S.kpWinners.ToDictionary(x => x.k, x => int.Parse(x.v));
            var pw = S.pokalWinners.ToDictionary(x => x.k, x => int.Parse(x.v));
            // Landespokale: 3. Liga bis höchstens Bezirksebene (max. ~128 Teams) + Kreispokalsieger der Vorsaison
            foreach (var code in Pokal.Keys)
            {
                var ids = TeamsOf(l => !l.foreign && l.level >= 3).Where(id => T(id).vb == code && !IsRes(T(id).name)).ToList();
                var kr = S.leagues.Where(l => !l.foreign && l.vb == code && !string.IsNullOrEmpty(l.kreis)).Select(l => l.kreis).Distinct().ToList();
                if (kr.Count > 0 && ids.Count > 64)
                {
                    int cut = 7; List<int> top;
                    do { int ct = cut; top = TeamsOf(l => !l.foreign && l.level >= 3 && l.level <= ct).Where(id => T(id).vb == code && !IsRes(T(id).name)).ToList(); } while (top.Count + kr.Count > 128 && --cut >= 4);
                    var set = new HashSet<int>(top);
                    foreach (var k in kr)
                    {
                        int w; if (!kw.TryGetValue(code + "|" + k, out w) || IsRes(T(w).name) || set.Contains(w))
                            w = TeamsOf(l => !l.foreign && l.kreis == k && l.vb == code).Where(id => !IsRes(T(id).name) && !set.Contains(id)).OrderByDescending(id => T(id).r).FirstOr(_ => true, -1);
                        if (w >= 0) set.Add(w);
                    }
                    ids = set.ToList();
                }
                var c = MakeCup("lp-" + code, Pokal[code], "lp", ids, code); if (c != null) S.cups.Add(c);
            }
            // Kreispokale
            foreach (var g in S.leagues.Where(l => !l.foreign && !string.IsNullOrEmpty(l.kreis)).GroupBy(l => l.vb + "|" + l.kreis))
            {
                var first = g.First();
                var c = MakeCup("kp-" + first.vb + "-" + first.kreis, "Kreispokal " + first.kreis, "kp", g.SelectMany(l => l.teams), first.vb, first.kreis);
                if (c != null) S.cups.Add(c);
            }
            // DFB-Pokal: 36 Profis + 4 aus der 3. Liga + 24 Amateure (Landespokalsieger, dazu je einer aus BY, NI, WF)
            var pros = TeamsOf(l => !l.foreign && l.level <= 2).ToList();
            var l3 = L("l3");
            var l3ids = (S.lastL3.Count > 0 ? S.lastL3 : l3.teams).Where(id => !IsRes(T(id).name) && l3.teams.Contains(id)).Take(4).ToList();
            var used = new HashSet<int>(pros.Concat(l3ids)); var am = new List<int>();
            var pool = TeamsOf(l => !l.foreign && l.level >= 3).Where(id => !IsRes(T(id).name) && !used.Contains(id)).ToList();
            foreach (var code in Pokal.Keys)
            {
                int pick; if (!pw.TryGetValue(code, out pick) || used.Contains(pick) || IsRes(T(pick).name))
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
            if (dfb != null) S.cups.Insert(0, dfb);
            // Termine: Runden über die Saison verteilt, Finale am letzten Spieltag
            foreach (var c in S.cups)
            {
                c.dates = new List<int>(); int D = Math.Max(2, S.lastDay);
                for (int k = 0; k < c.R; k++) c.dates.Add(k == c.R - 1 ? D : 1 + (int)Math.Round((k + 1) * (D - 2) / (double)c.R));
            }
        }

        // Wie weit ist ein Verein im Pokal gekommen?
        public string CupReach(Cup c, int id)
        {
            if (!c.teams.Contains(id)) return null;
            if (c.winner == id) return "Sieger";
            for (int k = 0; k < c.rounds.Count; k++)
            {
                var m = c.rounds[k].m.FirstOrDefault(x => x.h == id || x.a == id); if (m == null) continue;
                if (m.w >= 0 && m.w != id) return k == c.R - 1 ? "Finale" : RoundName(c.R, k);
                if (m.w < 0) return RoundName(c.R, k) + " (offen)";
            }
            return RoundName(c.R, Math.Min(c.R - 1, c.rounds.Count - 1));
        }
        public List<Cup> CupsOf(int id) { return S.cups.Where(c => c.teams.Contains(id)).ToList(); }
        // nächstes offenes Pokalspiel eines Vereins
        public CupMatch NextCupMatch(int id, out Cup cup, out int round)
        {
            cup = null; round = -1;
            foreach (var c in CupsOf(id))
            {
                if (c.winner >= 0 || c.played >= c.rounds.Count) continue;
                var m = c.rounds[c.played].m.FirstOrDefault(x => (x.h == id || x.a == id) && x.w < 0 && !x.bye);
                if (m != null && (cup == null || c.dates[c.played] < cup.dates[cup.played])) { cup = c; round = c.played; return m; }
            }
            return null;
        }
    }
}
