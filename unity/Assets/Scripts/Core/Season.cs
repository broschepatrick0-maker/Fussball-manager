// Saisonwechsel: Relegation, Auf- und Abstieg in der ganzen Pyramide, Ligagrößen, Zweitvertretungen.
// Übertragen aus der Web-App (11-season.js, 02-state.js). Pokale, Finanzen und Transfers folgen später.
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace FP.Core
{
    public partial class Game
    {
        static readonly Regex ResRx = new Regex(@"\s(II+|[2-4])$");
        public static bool IsRes(string n) { return ResRx.IsMatch(n); }
        public static string ResBase(string n) { return ResRx.Replace(n, ""); }

        class DL { public Dictionary<int, int> lv = new Dictionary<int, int>(); public Dictionary<int, League> lg = new Dictionary<int, League>(); public Dictionary<string, int> byName = new Dictionary<string, int>(); }
        DL DeLevels()
        {
            var d = new DL();
            foreach (var l in S.leagues) foreach (var id in l.teams) { var t = T(id); if (string.IsNullOrEmpty(t.vb)) continue; d.lv[id] = l.level; d.lg[id] = l; d.byName[t.name] = id; }
            return d;
        }
        // Zweitvertretungen: mind. 2 Ligen unter der 1. Mannschaft, III mind. 1 Liga unter der II
        static int ResMinLevel(string name, Dictionary<string, int> byName, Func<int, int?> lvOf)
        {
            if (!IsRes(name)) return 0;
            string b = ResBase(name); int need = 0; int f;
            if (byName.TryGetValue(b, out f) && lvOf(f).HasValue) need = lvOf(f).Value + 2;
            if (name.EndsWith(" III") && byName.TryGetValue(b + " II", out f) && lvOf(f).HasValue) need = Math.Max(need, lvOf(f).Value + 1);
            return need;
        }
        List<string> HomeLeagues(int id)
        {
            var t = T(id); var r = new List<string>(t.from); r.AddRange(t.hm.Select(x => x.v));
            string s; if (homeSeed.TryGetValue(t.name, out s)) r.Add(s);
            return r;
        }

        class Moves
        {
            public Dictionary<int, string> d = new Dictionary<int, string>(); public List<int> order = new List<int>();
            public void Set(int id, string to) { if (!d.ContainsKey(id)) order.Add(id); d[id] = to; }
            public bool Has(int id) { return d.ContainsKey(id); }
        }

        // ---------- Relegation (Hin- und Rückspiel; a ist der Klassentiefere) ----------
        int TwoLeg(int a, int b, out string txt)
        {
            var m1 = Play(a, b); var m2 = Play(b, a);
            int ga = m1[0] + m2[1], gb = m1[1] + m2[0]; bool et = false; int pb = -1, pa = -1;
            if (ga == gb)
            {
                double rb = EffR(b), ra = EffR(a);
                m2[0] += Rng.Pois(Lam(rb, ra, true) / 3); m2[1] += Rng.Pois(Lam(ra, rb, false) / 3); et = true;
                ga = m1[0] + m2[1]; gb = m1[1] + m2[0];
            }
            int w;
            if (ga == gb)
            {
                double qb = .74 + (T(b).r - T(a).r) / 400.0, qa = .74 + (T(a).r - T(b).r) / 400.0; int x = 0, y = 0;
                for (int i = 0; i < 5; i++) { if (Rng.U() < qb) x++; if (Rng.U() < qa) y++; }
                while (x == y) { if (Rng.U() < qb) x++; if (Rng.U() < qa) y++; }
                pb = x; pa = y; w = x > y ? b : a;
            }
            else w = ga > gb ? a : b;
            txt = T(a).name + " – " + T(b).name + " " + m1[0] + ":" + m1[1] + ", " + m2[1] + ":" + m2[0] + (et ? " n.V." : "") +
                  " (" + ga + ":" + gb + (pb >= 0 ? ", " + pa + ":" + pb + " i.E." : "") + ")";
            S.lastRel.Add(txt);
            return w;
        }

        // ---------- Auf- und Abstiegsentscheidungen ----------
        Moves DecideMoves(Dictionary<string, List<int>> st, List<string> log)
        {
            var mv = new Moves(); string txt;
            foreach (var l in S.leagues) if (!l.foreign && l.tgt == 0) l.tgt = l.teams.Count;
            var DL = DeLevels();
            Func<int, int?> lvF = id => { if (mv.Has(id)) return L(mv.d[id]).level; int v; return DL.lv.TryGetValue(id, out v) ? v : (int?)null; };
            Func<int, int, bool> okAt = (id, lv) => lv >= ResMinLevel(T(id).name, DL.byName, lvF);
            var bl = st["bl"]; var b2 = st["bl2"]; var l3 = st["l3"];

            int w1 = TwoLeg(b2[2], bl[15], out txt); log.Add("Relegation Bundesliga: " + txt);
            mv.Set(bl[16], "bl2"); mv.Set(bl[17], "bl2"); mv.Set(b2[0], "bl"); mv.Set(b2[1], "bl");
            if (w1 == b2[2]) { mv.Set(b2[2], "bl"); mv.Set(bl[15], "bl2"); }

            var l3ok = l3.Where(id => okAt(id, 2) && !IsRes(T(id).name)).ToList();
            if (l3ok.Count >= 3)
            {
                int w2 = TwoLeg(l3ok[2], b2[15], out txt); log.Add("Relegation 2. Bundesliga: " + txt);
                mv.Set(b2[16], "l3"); mv.Set(b2[17], "l3"); mv.Set(l3ok[0], "bl2"); mv.Set(l3ok[1], "bl2");
                if (w2 != b2[15]) { mv.Set(w2, "bl2"); mv.Set(b2[15], "l3"); }
            }
            foreach (var id in l3.Skip(Math.Max(0, l3.Count - 4)).Where(x => !mv.Has(x)).ToList()) mv.Set(id, RegionOf(T(id).vb));

            // Regionalliga-Meister: die drei besten direkt, Platz 4 und 5 in Aufstiegsspielen
            var ch = new List<KeyValuePair<int, double>>();
            foreach (var rid in RegionalLeagues)
            {
                var lg = L(rid); if (lg == null) continue; var tab = Table(lg);
                var c = tab.FirstOrDefault(r => !mv.Has(r.id) && okAt(r.id, 3)); if (c == null) continue;
                if (c.id != tab[0].id) log.Add(lg.name + ": " + T(tab[0].id).name + " darf als Zweitvertretung nicht aufsteigen – " + T(c.id).name + " rückt nach");
                ch.Add(new KeyValuePair<int, double>(c.id, c.p / (double)Math.Max(1, c.sp)));
            }
            ch = ch.OrderByDescending(x => x.Value).ToList();
            foreach (var c in ch.Take(3)) { mv.Set(c.Key, "l3"); log.Add("Aufstieg in die 3. Liga: " + T(c.Key).name); }
            if (ch.Count > 4) { int w3 = TwoLeg(ch[4].Key, ch[3].Key, out txt); mv.Set(w3, "l3"); log.Add("Aufstiegsspiele 3. Liga: " + txt); }
            else if (ch.Count > 3) mv.Set(ch[3].Key, "l3");

            // Oberliga-Meister in die Regionalliga
            foreach (var l in S.leagues.Where(x => x.level == 5 && !x.foreign))
            {
                var s = st[l.id]; int c = s.FirstOr(id => !mv.Has(id) && okAt(id, 4), -1); if (c < 0) continue;
                if (c != s[0]) log.Add(l.name + ": " + T(s[0]).name + " darf als Zweitvertretung nicht aufsteigen");
                mv.Set(c, RegionOf(l.vb)); log.Add("Aufstieg in die " + L(mv.d[c]).name + ": " + T(c).name);
            }

            // Amateurligen: Meister tauscht mit dem Letzten der nächsthöheren Liga im Verband
            var ams = S.leagues.Where(l => !l.foreign && l.level >= 6).OrderBy(l => l.level).ToList();
            var downIdx = new Dictionary<string, int>(); var relGrp = new Dictionary<string, List<KeyValuePair<League, int>>>(); var grpOrder = new List<string>();
            Action<string, League, int> addGrp = (uid, d, last) => { if (!relGrp.ContainsKey(uid)) { relGrp[uid] = new List<KeyValuePair<League, int>>(); grpOrder.Add(uid); } relGrp[uid].Add(new KeyValuePair<League, int>(d, last)); };
            foreach (var d in ams)
            {
                var ups = S.leagues.Where(u => !u.foreign && u.level == d.level - 1 && u.vbs.Contains(d.vb) && u.level >= 5).ToList();
                if (ups.Count == 0) continue;
                var u0 = ups.FirstOrDefault(x => !string.IsNullOrEmpty(d.up) && x.name == d.up)
                      ?? ups.FirstOrDefault(x => !string.IsNullOrEmpty(x.kreis) && x.kreis == d.kreis) ?? ups[0];
                var sd = st[d.id]; var su = st[u0.id];
                int champ = sd.FirstOr(id => !mv.Has(id) && okAt(id, u0.level), -1); if (champ < 0) continue;
                int firstFree = sd.FirstOr(id => !mv.Has(id), -1);
                if (champ != firstFree) log.Add(d.name + ": " + T(firstFree).name + " darf als Zweitvertretung nicht aufsteigen");
                int di; downIdx.TryGetValue(u0.id, out di); downIdx[u0.id] = di + 1;
                var pool = su.Where(id => !mv.Has(id)).ToList();
                int last = pool.Count > 0 ? pool[pool.Count - 1] : -1;
                if (u0.vbs.Count > 1)
                {
                    var same = pool.Where(id => T(id).vb == d.vb).ToList();
                    if (same.Count > 0) { int c = same[same.Count - 1]; if (pool.IndexOf(c) >= pool.Count - 4) last = c; }
                }
                mv.Set(champ, u0.id);
                if (last >= 0) { mv.Set(last, d.id); addGrp(u0.id, d, last); }
                log.Add(d.name + ": " + T(champ).name + " steigt auf in " + u0.name + (last >= 0 ? ", " + T(last).name + " steigt ab" : ""));
                // ab Kreisliga abwärts: Vizemeister spielt Relegation gegen den Vorletzten (max. ¼ der Liga steigt ab)
                int quota = Math.Max(2, (int)Math.Floor((u0.tgt > 0 ? u0.tgt : u0.teams.Count) / 4.0 + 0.5));
                if (d.level >= 8 && downIdx[u0.id] < quota)
                {
                    int vize = sd.FirstOr(id => !mv.Has(id) && okAt(id, u0.level), -1);
                    var pool2 = su.Where(id => !mv.Has(id)).ToList(); int opp = pool2.Count > 0 ? pool2[pool2.Count - 1] : -1;
                    if (vize >= 0 && opp >= 0)
                    {
                        int w = TwoLeg(vize, opp, out txt); log.Add("Relegation " + u0.name + "/" + d.name + ": " + txt);
                        if (w == vize)
                        {
                            downIdx[u0.id]++; mv.Set(vize, u0.id); mv.Set(opp, d.id); addGrp(u0.id, d, opp);
                            log.Add(d.name + ": " + T(vize).name + " steigt über die Relegation auf, " + T(opp).name + " steigt ab");
                        }
                    }
                }
            }
            // Absteiger zurück in ihre Heimatliga (dort, wo sie herkamen), sonst per Ortsname
            foreach (var uid in grpOrder)
            {
                var g = relGrp[uid]; if (g.Count < 2) continue;
                var free = g.Select(x => x.Key).ToList(); var lasts = g.Select(x => x.Value).ToList();
                var outD = new Dictionary<int, League>(); var outO = new List<int>();
                foreach (var id in lasts) { var h = HomeLeagues(id); int i = free.FindIndex(dd => h.Contains(dd.name)); if (i >= 0 && !outD.ContainsKey(id)) { outD[id] = free[i]; outO.Add(id); free.RemoveAt(i); } }
                foreach (var id in lasts)
                {
                    if (outD.ContainsKey(id) || free.Count == 0) continue;
                    int bi = 0; double bs = -1;
                    for (int i = 0; i < free.Count; i++) { double sc = TownScore(T(id).name, free[i]) + (free[i].vb == T(id).vb ? 100 : 0); if (sc > bs) { bs = sc; bi = i; } }
                    outD[id] = free[bi]; outO.Add(id); free.RemoveAt(bi);
                }
                foreach (var id in outO)
                {
                    var dd = outD[id]; mv.Set(id, dd.id);
                    string tail = ", " + T(id).name + " steigt ab"; int line = log.FindIndex(x => x.EndsWith(tail));
                    if (line >= 0) log[line] = log[line] + " → " + dd.name;
                }
            }
            return mv;
        }

        static readonly HashSet<string> TownStop = new HashSet<string>(("Blau,Weiß,Weiss,Grün,Gelb,Roter,Rote,Stern,Schwarz,Gold,Glück,Fortschritt,Wacker,Germ,Empor,Spg.,Kickers,Preussen,Preußen,Arminia,Aufbau,Rotation,Teutonia,Saxonia,Allemannia,Askania,Edelweiß,Handwerk,Medizin,Heide,Tura,Rasen,Sportring,Spora,TSV,FC,SC,SG,VfB,VfL,VfR,TuS,TSG,FSV,SpVgg,DJK,ASV,ESV,BSV,SSV,TV,FV,SpFr,Sportfreunde,Eintracht,Germania,Concordia,Viktoria,Union,Borussia,Fortuna,Rot-Weiß,Blau-Weiß,Grün-Weiß,Schwarz-Weiß,Traktor,Turbine,Dynamo,Lok,Motor,Stahl,Chemie,Einheit,Sport,Verein,Club,e.V.,II,III,IV,1.,SpG,JSG,Spvgg,SuS,TuRa,TSC,FSG,SVG,SKV,SG.,am,an,der,die,im,in,b.,a.,bei,und,St.").Split(','));
        static List<string> TownTokens(string n)
        {
            return Regex.Split(n.Replace("(", " ").Replace(")", " "), @"[\s/\-]+").Where(w => w.Length >= 4 && !TownStop.Contains(w) && !char.IsDigit(w[0])).ToList();
        }
        double TownScore(string name, League d)
        {
            var tk = TownTokens(name); if (tk.Count == 0) return 0; double sc = 0;
            string dn = (d.name + " " + (d.kreis ?? "")).ToLowerInvariant();
            var lv = new List<League> { d }; var all = new List<int>(d.teams);
            for (int k = 0; k < 3; k++) { var nm = new HashSet<string>(lv.Select(l => l.name)); lv = S.leagues.Where(l => !l.foreign && nm.Contains(l.up)).ToList(); foreach (var l in lv) all.AddRange(l.teams); }
            var inD = new HashSet<int>(d.teams);
            foreach (var w in tk)
            {
                string lw = w.ToLowerInvariant(); if (dn.Contains(lw)) sc += 5;
                foreach (var id in all) if (T(id).name.ToLowerInvariant().Contains(lw)) sc += inD.Contains(id) ? 1 : .5;
            }
            return sc;
        }

        League DownLeague(League cur, Team t)
        {
            if (cur.level == 1) return L("bl2"); if (cur.level == 2) return L("l3"); if (cur.level == 3) return L(RegionOf(t.vb));
            var c = S.leagues.Where(l => !l.foreign && l.level == cur.level + 1 && l.vbs.Contains(t.vb)).ToList(); if (c.Count == 0) return null;
            var hl = HomeLeagues(t.id); var home = c.FirstOrDefault(l => hl.Contains(l.name)); if (home != null) return home;
            var feeds = c.Where(l => l.up == cur.name).ToList(); if (feeds.Count > 0) return feeds.OrderBy(l => l.teams.Count).First();
            if (!string.IsNullOrEmpty(cur.kreis) && cur.level >= 8) return null;
            var viaK = c.FirstOrDefault(l => !string.IsNullOrEmpty(cur.kreis) && l.kreis == cur.kreis); if (viaK != null) return viaK;
            return c.OrderBy(l => l.teams.Count).First();
        }

        void EnforceReserves(Dictionary<string, List<int>> st, List<string> log)
        {
            if (S.parked.Count > 0)
            {
                var D = DeLevels();
                S.parked = S.parked.Where(x =>
                {
                    var l = L(x.lg); if (l == null) return false; var t = T(x.id);
                    if (ResMinLevel(t.name, D.byName, y => D.lv.ContainsKey(y) ? D.lv[y] : (int?)null) <= l.level) { l.teams.Add(x.id); t.lv = l.level; log.Add(t.name + " kehrt in die " + l.name + " zurück"); return false; }
                    return true;
                }).ToList();
            }
            for (int pass = 0; pass < 4; pass++)
            {
                bool changed = false; var D = DeLevels();
                Func<int, int?> lvOf = y => D.lv.ContainsKey(y) ? D.lv[y] : (int?)null;
                foreach (var l in S.leagues.ToList()) foreach (var id in l.teams.ToList())
                {
                    var t = T(id); if (string.IsNullOrEmpty(t.vb) || !IsRes(t.name) || !D.lv.ContainsKey(id)) continue;
                    int need = ResMinLevel(t.name, D.byName, lvOf); if (D.lv[id] >= need) continue;
                    var cur = D.lg[id]; var dest = DownLeague(cur, t);
                    if (dest == null)
                    {
                        if (id == S.fav || cur.level > 4) continue;
                        cur.teams.Remove(id); D.lv.Remove(id); S.parked.Add(new Parked { id = id, lg = cur.id });
                        log.Add("Zwangsabstieg: " + t.name + " muss mind. zwei Ligen unter " + ResBase(t.name) + " spielen und zieht sich zurück"); changed = true; continue;
                    }
                    var order = st.ContainsKey(dest.id) ? st[dest.id].Where(x => dest.teams.Contains(x)).ToList() : new List<int>(dest.teams);
                    int sub = order.FirstOr(x => { var n = T(x).name; return !IsRes(n) || ResMinLevel(n, D.byName, lvOf) <= cur.level; }, -1);
                    cur.teams.Remove(id); dest.teams.Add(id); D.lv[id] = dest.level; D.lg[id] = dest;
                    if (sub >= 0) { dest.teams.Remove(sub); cur.teams.Add(sub); D.lv[sub] = cur.level; D.lg[sub] = cur; }
                    log.Add("Zwangsabstieg: " + t.name + " muss mind. zwei Ligen unter " + ResBase(t.name) + " spielen → " + dest.name + (sub >= 0 ? " · " + T(sub).name + " rückt in die " + cur.name + " nach" : ""));
                    changed = true;
                }
                if (!changed) break;
            }
        }

        // Ligagrößen in den Amateurklassen stabil halten (Sollgröße = Größe beim Anlegen)
        void BalanceAmateur(Dictionary<string, List<int>> st, List<string> log)
        {
            Func<League, List<League>> feed = u => S.leagues.Where(d => !d.foreign && d.level == u.level + 1 && d.up == u.name).ToList();
            var D = DeLevels(); Func<int, int?> lvOf = y => D.lv.ContainsKey(y) ? D.lv[y] : (int?)null;
            Func<int, int, bool> ok = (id, lv) => lv >= ResMinLevel(T(id).name, D.byName, lvOf);
            Func<League, List<int>> ord = l => { var s = st.ContainsKey(l.id) ? st[l.id] : new List<int>(); var r = s.Where(x => l.teams.Contains(x)).ToList(); r.AddRange(l.teams.Where(x => !s.Contains(x))); return r; };
            foreach (var l in S.leagues.Where(x => !x.foreign && x.level >= 6 && x.tgt > 0).OrderBy(x => x.level).ToList())
            {
                int g = 0;
                while (l.teams.Count > l.tgt + 1 && g++ < 8)
                {
                    var subs = feed(l).OrderBy(a => a.teams.Count - a.tgt).ToList();
                    var sib = S.leagues.Where(x => x != l && !x.foreign && x.level == l.level && x.vb == l.vb && x.kreis == l.kreis && x.tgt > 0 && x.teams.Count < x.tgt).OrderBy(a => a.teams.Count - a.tgt).ToList();
                    var cand = ord(l).Where(x => x != S.fav).ToList(); if (cand.Count == 0) break; int v = cand[cand.Count - 1];
                    var dest = subs.FirstOrDefault() ?? sib.FirstOrDefault(); if (dest == null) break;
                    l.teams.Remove(v); dest.teams.Add(v); D.lv[v] = dest.level;
                    log.Add(dest.level > l.level ? l.name + " zu groß: " + T(v).name + " steigt zusätzlich ab → " + dest.name : "Umgruppierung: " + T(v).name + " wechselt von der " + l.name + " in die " + dest.name);
                }
                g = 0;
                while (l.teams.Count < l.tgt - 1 && g++ < 8)
                {
                    League bf = null; int bid = -1, bi = int.MaxValue;
                    foreach (var f in feed(l))
                    {
                        if (f.teams.Count <= Math.Max(6, f.tgt - 2)) continue;
                        var o = ord(f); int c = o.FirstOr(x => ok(x, l.level), -1); if (c < 0) continue;
                        int i = o.IndexOf(c); if (i < bi) { bi = i; bid = c; bf = f; }
                    }
                    if (bf != null) { bf.teams.Remove(bid); l.teams.Add(bid); D.lv[bid] = l.level; log.Add(l.name + ": " + T(bid).name + " rückt aus der " + bf.name + " nach"); continue; }
                    var sb = S.leagues.Where(x => x != l && !x.foreign && x.level == l.level && x.vb == l.vb && x.kreis == l.kreis && x.tgt > 0 && x.teams.Count > x.tgt).OrderByDescending(a => a.teams.Count - a.tgt).FirstOrDefault();
                    if (sb == null) break;
                    var cand = ord(sb).Where(x => x != S.fav).ToList(); if (cand.Count == 0) break; int v = cand[cand.Count - 1];
                    sb.teams.Remove(v); l.teams.Add(v); log.Add("Umgruppierung: " + T(v).name + " wechselt von der " + sb.name + " in die " + l.name);
                }
            }
        }

        static readonly Dictionary<int, float> Norm = new Dictionary<int, float> { { 1, 78.6f }, { 2, 68.8f }, { 3, 60 }, { 4, 51.5f }, { 5, 46 }, { 6, 41 }, { 7, 36 }, { 8, 31 }, { 9, 26 }, { 10, 21 }, { 11, 17 }, { 12, 14 } };

        // ---------- Saisonende ----------
        public SeasonLog EndSeason()
        {
            SimToEnd();
            var log = new List<string>(); S.lastRel.Clear();
            var st = new Dictionary<string, List<int>>();
            foreach (var l in S.leagues) st[l.id] = Standing(l);
            RecordHistory(st);
            log.Add("Deutscher Meister: " + T(st["bl"][0]).name);
            foreach (var l in S.leagues.Where(x => x.foreign)) log.Add((string.IsNullOrEmpty(l.title) ? l.name : l.title) + ": " + T(st[l.id][0]).name);
            // Pokalsieger
            S.kpWinners = new List<KV>(); S.pokalWinners = new List<KV>();
            foreach (var c in S.cups.Where(c => c.winner >= 0))
            {
                if (c.type == "dfb") log.Insert(1, "DFB-Pokal: " + T(c.winner).name);
                else if (c.type == "lp") { S.pokalWinners.Add(new KV { k = c.vb, v = c.winner.ToString() }); log.Add(c.name + ": " + T(c.winner).name + " (DFB-Pokal-Teilnehmer)"); }
                else S.kpWinners.Add(new KV { k = c.vb + "|" + c.kreis, v = c.winner.ToString() });
            }
            S.lastL3 = new List<int>(st["l3"]);
            var mv = DecideMoves(st, log);
            var lvOld = new Dictionary<int, int>(); foreach (var l in S.leagues) foreach (var id in l.teams) lvOld[id] = l.level;
            foreach (var id in mv.order)
            {
                var to = L(mv.d[id]); if (to == null) continue;
                var fromLg = S.leagues.FirstOrDefault(l => l.teams.Contains(id));
                if (fromLg != null && to.level < fromLg.level && fromLg.level >= 5)
                {
                    var t = T(id); var nf = new List<string> { fromLg.name }; nf.AddRange(HomeLeagues(id).Where(n => n != fromLg.name)); t.from = nf.Take(4).ToList();
                }
                foreach (var l in S.leagues) l.teams.Remove(id);
                to.teams.Add(id);
            }
            // Regionalligen auf 18 Vereine bringen
            foreach (var rid in RegionalLeagues)
            {
                var lg = L(rid); if (lg == null) continue; var order = st[rid].Where(x => lg.teams.Contains(x)).ToList();
                if (lg.teams.Count < 18) log.Add(lg.name + " spielt mit " + lg.teams.Count + " Teams");
                while (lg.teams.Count > 18)
                {
                    var rest = order.Where(x => lg.teams.Contains(x)).ToList(); if (rest.Count == 0) break; int victim = rest[rest.Count - 1];
                    lg.teams.Remove(victim);
                    var cands = S.leagues.Where(l => !l.foreign && l.level == 5 && l.vbs.Contains(T(victim).vb)).ToList(); var hl = HomeLeagues(victim);
                    var dest = cands.FirstOrDefault(l => hl.Contains(l.name)) ?? cands.OrderBy(l => l.teams.Count).FirstOrDefault();
                    if (dest != null) { dest.teams.Add(victim); log.Add("Abstieg aus der " + lg.name + ": " + T(victim).name + " → " + dest.name); }
                    else { lg.teams.Add(victim); break; }
                }
            }
            // Oberligen auf Sollgröße
            var DLs = DeLevels(); Func<int, int?> lvF = id => DLs.lv.ContainsKey(id) ? DLs.lv[id] : (int?)null;
            foreach (var ol in S.leagues.Where(l => l.level == 5 && !l.foreign && l.size > 0).ToList())
            {
                var order = st[ol.id].Where(x => ol.teams.Contains(x)).ToList(); int g = 0;
                while (ol.teams.Count > ol.size && g++ < 8)
                {
                    int victim = Enumerable.Reverse(order).FirstOr(x => ol.teams.Contains(x) && S.leagues.Any(l => l.level == 6 && !l.foreign && l.vbs.Contains(T(x).vb)), -1);
                    if (victim < 0) break;
                    var vl = S.leagues.Where(l => l.level == 6 && !l.foreign && l.vbs.Contains(T(victim).vb)).ToList(); var hl = HomeLeagues(victim);
                    var dest = vl.FirstOrDefault(l => hl.Contains(l.name)) ?? vl.OrderBy(l => l.teams.Count).First();
                    ol.teams.Remove(victim); dest.teams.Add(victim); order.Remove(victim); log.Add("Abstieg aus der " + ol.name + ": " + T(victim).name + " → " + dest.name);
                }
                g = 0;
                while (ol.teams.Count < ol.size && g++ < 6)
                {
                    var feeders = S.leagues.Where(l => l.level == 6 && !l.foreign && l.up == ol.name).ToList();
                    League bf = null; int bid = -1, bi = int.MaxValue;
                    foreach (var f in feeders)
                    {
                        var o = st[f.id].Where(x => f.teams.Contains(x)).ToList();
                        int c = o.FirstOr(x => 5 >= ResMinLevel(T(x).name, DLs.byName, lvF), -1); if (c < 0) continue;
                        int i = o.IndexOf(c); if (i < bi) { bi = i; bid = c; bf = f; }
                    }
                    if (bf == null) break;
                    bf.teams.Remove(bid); ol.teams.Add(bid); log.Add(ol.name + ": " + T(bid).name + " rückt zusätzlich aus der " + bf.name + " nach");
                }
            }
            EnforceReserves(st, log);
            BalanceAmateur(st, log);
            // Stärke anpassen: Aufsteiger legen zu, Absteiger verlieren; leichter Zug zum Niveau der Spielklasse
            foreach (var l in S.leagues) foreach (var id in l.teams)
            {
                var t = T(id); int o; if (!lvOld.TryGetValue(id, out o)) o = l.level;
                if (o > l.level) t.r += 2.5f; else if (o < l.level) t.r -= 2.5f;
                float nrm; if (!l.foreign && Norm.TryGetValue(l.level, out nrm)) t.r += (nrm - t.r) * 0.04f;
                t.r = (float)Math.Round(t.r + Rng.Range(-1.5, 1.5), 1);
                t.r = Math.Max(5, Math.Min(99, t.r));
                t.fm = 0; t.mo = 60;
            }
            var sl = new SeasonLog { season = S.season, lines = log };
            S.log.Insert(0, sl); if (S.log.Count > 30) S.log.RemoveRange(30, S.log.Count - 30);
            AgeSquads();
            S.season++;
            Reindex();
            StartSeason();
            return sl;
        }

        void RecordHistory(Dictionary<string, List<int>> st)
        {
            if (S.fav < 0) return; var l = LeagueOf(S.fav); if (l == null) return;
            var tab = Table(l); int pos = tab.FindIndex(r => r.id == S.fav);
            var h = S.hist.FirstOrDefault(x => x.team == S.fav); if (h == null) { h = new TeamHist { team = S.fav }; S.hist.Add(h); }
            string cups = string.Join(" · ", CupsOf(S.fav).Select(c => c.name + ": " + CupReach(c, S.fav)).ToArray());
            h.e.Insert(0, new HistEntry { season = S.season, league = l.name, level = l.level, pos = pos + 1, n = tab.Count, pts = tab[pos].p, cups = cups });
        }
    }
}
