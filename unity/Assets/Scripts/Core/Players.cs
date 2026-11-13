// Kader: echte Kader aus dem Export, alle anderen werden beim ersten Ansehen passend zur Vereinsstärke erzeugt.
// Übertragen aus der Web-App (07-squad.js, 07a-names.js).
using System;
using System.Collections.Generic;
using System.Linq;

namespace FP.Core
{
    public partial class Game
    {
        public static readonly string[] Pos = { "TW", "AB", "MF", "ST" };
        Dictionary<string, NatDto> natByCode;

        NatDto Nat(string c)
        {
            if (natByCode == null) { natByCode = new Dictionary<string, NatDto>(); if (names != null) foreach (var n in names.nat) natByCode[n.code] = n; }
            NatDto r; return c != null && natByCode.TryGetValue(c, out r) ? r : null;
        }
        public string NatName(string code)
        {
            if (string.IsNullOrEmpty(code)) return "";
            if (code.StartsWith("X:")) return code.Substring(2);
            var n = Nat(code); return n != null ? n.name : code;
        }

        string RollNat(Team t)
        {
            if (names == null) return "DE";
            int lv = t.lv > 0 ? t.lv : 9;
            if (!string.IsNullOrEmpty(t.cc))
            {
                if (Nat(t.cc) != null && Rng.U() < .62) return t.cc;
                return Rng.PickW(names.top.Where(x => x.k != t.cc).ToList());
            }
            float share = lv < names.foreignShare.Count ? names.foreignShare[lv] : .06f;
            if (Rng.U() >= share) return "DE";
            if (lv <= 4) return Rng.PickW(names.top);
            if (lv <= 6)
            {
                var m = new Dictionary<string, float>();
                foreach (var x in names.top) m[x.k] = x.w;
                foreach (var x in names.low) { float w; m.TryGetValue(x.k, out w); m[x.k] = w + x.w; }
                return Rng.PickW(m.Select(kv => new KW { k = kv.Key, w = kv.Value }).ToList());
            }
            return Rng.PickW(names.low);
        }
        string NameFor(string nat)
        {
            var p = Nat(nat) ?? Nat("DE"); if (p == null) return "Spieler " + Rng.Int(1000);
            if (nat == "DE" && Rng.U() < .13)
            {
                var m = Nat(Rng.PickW(names.mix)) ?? p;
                return Rng.U() < .5 ? Rng.Pick(m.first) + " " + Rng.Pick(p.last) : Rng.Pick(p.first) + " " + Rng.Pick(m.last);
            }
            return Rng.Pick(p.first) + " " + Rng.Pick(p.last);
        }
        static float ClampS(double x) { return (float)Math.Max(10, Math.Min(99, x)); }

        int NewPlayer(Team t, string pos, double st, int age = -1)
        {
            string nat = RollNat(t);
            var p = new Player { id = S.players.Count, n = NameFor(nat), nat = nat, p = pos, a = age >= 0 ? age : 18 + Rng.Int(16), s = (float)Math.Round(ClampS(st), 1) };
            S.players.Add(p); return p.id;
        }

        // Durchschnitt der besten Elf (1-4-4-2), fehlende Positionen mit schwächeren Ersatzwerten
        public float XI(List<int> sq)
        {
            var spare = sq.Select(id => S.players[id].s).OrderByDescending(x => x).ToList();
            int extra = 0; double sum = 0;
            foreach (var pn in new[] { new KeyValuePair<string, int>("TW", 1), new KeyValuePair<string, int>("AB", 4), new KeyValuePair<string, int>("MF", 4), new KeyValuePair<string, int>("ST", 2) })
            {
                var a = sq.Where(id => S.players[id].p == pn.Key).Select(id => S.players[id].s).OrderByDescending(x => x).ToList();
                while (a.Count < pn.Value) { a.Add(Math.Max(15, (11 + extra < spare.Count ? spare[11 + extra] : 20) - 6)); extra++; }
                sum += a.Take(pn.Value).Sum();
            }
            return (float)(sum / 11);
        }

        public List<int> Squad(int id)
        {
            var t = T(id); if (t.squad.Count > 0) return t.squad;
            var plan = new[] { new KeyValuePair<string, int>("TW", 3), new KeyValuePair<string, int>("AB", 8), new KeyValuePair<string, int>("MF", 8), new KeyValuePair<string, int>("ST", 5) };
            foreach (var pn in plan) for (int i = 0; i < pn.Value; i++) t.squad.Add(NewPlayer(t, pn.Key, t.r - 2 + Rng.Gauss() * 4 - i * 0.8));
            float d = t.r - XI(t.squad);
            foreach (var pid in t.squad) S.players[pid].s = (float)Math.Round(ClampS(S.players[pid].s + d), 1);
            Numbers(id);
            return t.squad;
        }

        // Rückennummern: TW 1, Abwehr 2–5, Mittelfeld 6/8/10, Sturm 9/11, danach frei – jede Nummer nur einmal
        void Numbers(int id)
        {
            var t = T(id); var used = new HashSet<int>(t.squad.Select(p => S.players[p].no).Where(n => n > 0));
            var pref = new Dictionary<string, int[]> { { "TW", new[] { 1, 12, 22 } }, { "AB", new[] { 2, 3, 4, 5, 15, 23 } }, { "MF", new[] { 6, 8, 10, 7, 14, 16, 18 } }, { "ST", new[] { 9, 11, 19, 20 } } };
            foreach (var pid in t.squad.OrderByDescending(p => S.players[p].s))
            {
                var p = S.players[pid]; if (p.no > 0) continue;
                int no = pref[p.p].FirstOr(n => !used.Contains(n), -1);
                if (no < 0) { no = 13; while (used.Contains(no)) no++; }
                p.no = no; used.Add(no);
            }
        }

        public float PlayerValue(Player p)
        {
            double am = p.a <= 21 ? 1.25 : p.a <= 24 ? 1.1 : p.a <= 28 ? 1 : p.a <= 30 ? .8 : p.a <= 32 ? .55 : .3;
            double s = Math.Min(p.s, 99), top = s > 70 ? (s - 70) * (s - 70) * .001 : 0;
            double raw = Math.Pow(10, 4.3 + (s - 30) * 0.055 + top) * am;
            double v = Math.Min(3e8, raw <= 1.2e8 ? raw : 1.2e8 * Math.Pow(raw / 1.2e8, .35));
            double r = v > 1e6 ? 1e5 : v > 1e5 ? 1e4 : 1e3;
            return (float)Math.Max(1000, Math.Round(v / r) * r);
        }

        // Saisonende: alle ein Jahr älter, Ältere hören auf und werden durch Nachwuchs ersetzt; Kader bleibt zur Vereinsstärke passend
        void AgeSquads()
        {
            foreach (var t in S.teams)
            {
                if (t.squad.Count == 0) continue;
                var leave = new List<int>();
                foreach (var pid in t.squad)
                {
                    var p = S.players[pid]; p.a++;
                    if (p.a < 24) p.s = ClampS(p.s + Rng.Range(0.5, 3)); else if (p.a > 30) p.s = ClampS(p.s - Rng.Range(0.5, 2.5));
                    if (p.a >= 34 && Rng.U() < (p.a - 32) * 0.25) leave.Add(pid);
                }
                foreach (var pid in leave) { var p = S.players[pid]; t.squad.Remove(pid); t.squad.Add(NewPlayer(t, p.p, t.r - 6 + Rng.Gauss() * 3, 17 + Rng.Int(3))); }
                float d = t.r - XI(t.squad);
                foreach (var pid in t.squad) S.players[pid].s = (float)Math.Round(ClampS(S.players[pid].s + d * 0.8), 1);
                Numbers(t.id);
            }
        }
    }
}
