// Finanzen: Umsatz nach Liga und Größe, Zuschauer, Gehälter, Stadion, Kredite, Saisonbilanz.
// Übertragen aus der Web-App (08-finance.js), auf Mein Verein und angesehene Vereine beschränkt.
using System;
using System.Collections.Generic;
using System.Linq;

namespace FP.Core
{
    [Serializable] public class FinH { public int season; public double rev, ex, res; }
    [Serializable] public class Fin { public int team; public double c, d, ir; public int cap; public List<FinH> h = new List<FinH>(); }
    public class FinBal { public List<KeyValuePair<string, double>> inc = new List<KeyValuePair<string, double>>(), exp = new List<KeyValuePair<string, double>>(); public double rev, ex, res, share; public int att, price, games; }

    public partial class Game
    {
        static readonly Dictionary<int, double> REVL = new Dictionary<int, double> { { 1, 44e6 }, { 2, 15.2e6 }, { 3, 4.4e6 }, { 4, 1.19e6 }, { 5, 4.75e5 }, { 6, 1.84e5 }, { 7, 7.6e4 }, { 8, 2.9e4 }, { 9, 1.5e4 }, { 10, 8e3 }, { 11, 5e3 }, { 12, 4e3 } };
        static readonly Dictionary<int, double> MEDV = new Dictionary<int, double> { { 1, 128e6 }, { 2, 48e6 }, { 3, 15.4e6 }, { 4, 5.2e6 }, { 5, 2.77e6 }, { 6, 1.43e6 }, { 7, 7.6e5 }, { 8, 4.07e5 }, { 9, 2.5e5 }, { 10, 1.5e5 }, { 11, 1e5 }, { 12, 8e4 } };
        static readonly Dictionary<int, double> WRATIO = new Dictionary<int, double> { { 1, .24 }, { 2, .22 }, { 3, .2 }, { 4, .16 }, { 5, .12 }, { 6, .09 }, { 7, .07 }, { 8, .05 }, { 9, .04 }, { 10, .03 }, { 11, .02 }, { 12, .02 } };
        static readonly Dictionary<int, int> LCAP = new Dictionary<int, int> { { 1, 42000 }, { 2, 22000 }, { 3, 12000 }, { 4, 5000 }, { 5, 2500 }, { 6, 1200 }, { 7, 800 }, { 8, 500 }, { 9, 300 }, { 10, 200 }, { 11, 150 }, { 12, 120 } };
        static readonly Dictionary<int, int> TPRICE = new Dictionary<int, int> { { 1, 35 }, { 2, 24 }, { 3, 16 }, { 4, 10 }, { 5, 7 }, { 6, 6 }, { 7, 5 }, { 8, 4 }, { 9, 3 }, { 10, 3 }, { 11, 2 }, { 12, 2 } };
        const double REVF = 48e6, MEDF = 140e6;
        static double Get(Dictionary<int, double> d, int k, double def) { double v; return d.TryGetValue(k, out v) ? v : def; }

        public int FinLv(int id) { var l = LeagueOf(id); return l == null ? 9 : l.foreign ? 1 : l.level; }
        bool FinForeign(int id) { var l = LeagueOf(id); return l != null && l.foreign; }
        double Med(int id) { return FinForeign(id) ? MEDF : Get(MEDV, FinLv(id), 1e5); }
        public double ValueFlat(Player p) { double am = p.a <= 21 ? 1.25 : p.a <= 24 ? 1.1 : p.a <= 28 ? 1 : p.a <= 30 ? .8 : p.a <= 32 ? .55 : .3; return Math.Min(1.8e8, Math.Pow(10, 4.3 + (Math.Min(p.s, 99) - 30) * 0.055) * am); }
        public double ClubValue(int id) { return Squad(id).Sum(pid => (double)PlayerValue(S.players[pid])); }
        public double Wage(Player p, int lv) { return ValueFlat(p) * Get(WRATIO, lv, .03); }
        public double WageBill(int id) { int lv = FinLv(id); return Squad(id).Sum(pid => Wage(S.players[pid], lv)); }
        public double EstRevenue(int id)
        {
            int lv = FinLv(id); bool f = FinForeign(id); double med = Med(id);
            double b = med * (f ? .24 : Get(WRATIO, lv, .03)) / (lv >= 5 && !f ? 0.69 : 0.71);
            double attr = Math.Max(.2, Math.Min(8, ClubValue(id) / med)); return b * (0.3 + 0.7 * attr);
        }

        public Fin FZ(int id)
        {
            var z = S.fin.FirstOrDefault(x => x.team == id); if (z != null) return z;
            var R = new Random(T(id).name.GetHashCode() ^ id); double est = EstRevenue(id); int lv = FinLv(id); bool f = FinForeign(id);
            double c = est * (0.1 + R.NextDouble() * 0.35);
            double d = R.NextDouble() < (lv <= 4 ? .45 : .25) ? Math.Round(est * (0.15 + R.NextDouble() * 0.7) / 1e3) * 1e3 : 0;
            double att = Math.Pow(Math.Max(.2, Math.Min(8, ClubValue(id) / Med(id))), .55);
            int lc; if (!LCAP.TryGetValue(lv, out lc)) lc = 300;
            int cap = (int)(Math.Round(Math.Min(81000, Math.Max(150, (f ? 40000 : lc) * att * (0.75 + R.NextDouble() * 0.5))) / 50) * 50);
            z = new Fin { team = id, c = Math.Round(c / 1e3) * 1e3, d = d, ir = d > 0 ? .045 : 0, cap = cap };
            S.fin.Add(z); return z;
        }

        double[] PrizeMoney(int id)
        {
            int lv = FinLv(id); double b = FinForeign(id) ? REVF : Get(REVL, lv, 8e3); double cup = 0;
            foreach (var c in S.cups.Where(x => x.teams.Contains(id)))
            {
                string r = c.played > 0 ? CupReach(c, id) : null; if (r == null) continue;
                if (c.type == "dfb") cup += r == "Sieger" ? 6e6 : r == "Finale" ? 3e6 : r == "Halbfinale" ? 1.5e6 : r == "Viertelfinale" ? 8e5 : 2e5;
                else if (r == "Sieger") cup += b * .08; else if (r == "Finale") cup += b * .03;
            }
            return new[] { 0, cup };
        }
        public static double StadUpkeep(int lv, int cap) { return cap * (lv <= 2 ? 45 : lv == 3 ? 25 : lv == 4 ? 10 : lv <= 8 ? 4 : lv == 9 ? 3.2 : lv == 10 ? 1.3 : .8); }

        // Saisonbilanz (perf: 0 = Letzter … 1 = Meister; ohne Angabe aus der aktuellen Tabelle)
        public FinBal Balance(int id, double perf = -1)
        {
            var lg = LeagueOf(id); if (lg == null) return null; var z = FZ(id); int lv = FinLv(id); bool f = lg.foreign;
            if (perf < 0) { var tb = Standing(lg); int i = tb.IndexOf(id); perf = tb.Count > 1 ? 1 - i / (double)(tb.Count - 1) : .5; }
            var b = new FinBal { share = lg.rounds.Count > 0 ? Math.Max(.05, lg.played / (double)lg.rounds.Count) : 1 };
            double total = EstRevenue(id) * (0.85 + 0.3 * perf);
            b.games = Math.Max(1, lg.teams.Count - 1); int pr; b.price = f ? 45 : TPRICE.TryGetValue(lv, out pr) ? pr : 3;
            double fill = Math.Min(1, 0.45 + 0.4 * perf + Math.Min(.25, 0.05 * Math.Log(1 + ClubValue(id) / Med(id), 2)));
            b.att = (int)Math.Round(z.cap * fill); double zus = Math.Min(b.att * (double)b.games * b.price, total * .45);
            double rest = total - zus; bool pro = lv <= 3 || f; var pm = PrizeMoney(id);
            b.inc.Add(new KeyValuePair<string, double>("TV-Gelder", pro ? rest * .5 : lv == 4 ? rest * .12 : 0));
            b.inc.Add(new KeyValuePair<string, double>("Zuschauer", zus));
            b.inc.Add(new KeyValuePair<string, double>("Sponsoring", rest * (pro ? .32 : lv == 4 ? .55 : .62)));
            b.inc.Add(new KeyValuePair<string, double>("Merchandising", pro ? rest * .12 : rest * .05));
            b.inc.Add(new KeyValuePair<string, double>("Mitglieder & Sonstiges", pro ? rest * .06 : rest * (lv == 4 ? .28 : .33)));
            b.inc.Add(new KeyValuePair<string, double>("Prämien (Pokal)", pm[0] + pm[1]));
            b.exp.Add(new KeyValuePair<string, double>("Spielergehälter", WageBill(id)));
            b.exp.Add(new KeyValuePair<string, double>("Stadion & Infrastruktur", StadUpkeep(lv, z.cap) + total * .03));
            b.exp.Add(new KeyValuePair<string, double>("Verwaltung & Personal", total * .09));
            b.exp.Add(new KeyValuePair<string, double>("Nachwuchs", total * .03));
            b.exp.Add(new KeyValuePair<string, double>("Abgaben, Steuern, Versicherungen", total * .04));
            b.exp.Add(new KeyValuePair<string, double>("Zinsen", z.d * z.ir));
            b.rev = b.inc.Sum(x => x.Value); b.ex = b.exp.Sum(x => x.Value); b.res = b.rev - b.ex;
            return b;
        }

        public double CreditLimit(int id)
        {
            var z = FZ(id); double rev = z.h.Count > 0 ? z.h[0].rev : EstRevenue(id);
            return Math.Max(0, rev * 0.4 + ClubValue(id) * 0.1 - z.d);
        }
        public double TakeLoan(int id, double amt)
        {
            var z = FZ(id); amt = Math.Round(Math.Min(amt, CreditLimit(id)) / 1e3) * 1e3; if (amt <= 0) return 0;
            z.ir = z.d > 0 ? (z.ir * z.d + .06 * amt) / (z.d + amt) : .06; z.d += amt; z.c += amt; return amt;
        }
        public double Repay(int id, double amt)
        {
            var z = FZ(id); amt = Math.Min(Math.Min(amt, z.d), Math.Max(0, z.c)); amt = Math.Floor(amt / 1e3) * 1e3; if (amt <= 0) return 0;
            z.c -= amt; z.d -= amt; if (z.d < 1e3) { z.d = 0; z.ir = 0; } return amt;
        }
        // Stadionausbau: Schritte und Kosten je Spielklasse (unten deutlich günstiger)
        public int StadStep(int id) { int lv = FinLv(id), cap = FZ(id).cap; if (cap < 2000) return cap < 500 ? 50 : cap < 1000 ? 100 : 250; return lv <= 2 ? 3000 : lv <= 4 ? 1500 : lv <= 6 ? 400 : lv <= 8 ? 250 : 150; }
        public double StadCost(int id) { int lv = FinLv(id); double perSeat = lv <= 2 ? 1800 : lv <= 4 ? 700 : lv <= 6 ? 260 : lv <= 8 ? 140 : 90; return StadStep(id) * perSeat; }
        public string StadiumUpgrade(int id)
        {
            var z = FZ(id); double cost = StadCost(id); if (z.c < cost) return "Dafür reicht das Geld nicht (" + Util.Money(cost) + ")";
            z.c -= cost; z.cap += StadStep(id); return "ok";
        }

        // Saisonende: Bilanz verbuchen, Tilgung, Liquidität sichern
        void SeasonFinances(Dictionary<string, List<int>> st, List<string> log)
        {
            var ids = S.fin.Select(x => x.team).ToList(); if (S.fav >= 0 && !ids.Contains(S.fav)) ids.Add(S.fav);
            foreach (var id in ids)
            {
                var lg = LeagueOf(id); if (lg == null) continue; var z = FZ(id);
                int i = st.ContainsKey(lg.id) ? st[lg.id].IndexOf(id) : -1, n = st.ContainsKey(lg.id) ? st[lg.id].Count : 1;
                double perf = i < 0 || n < 2 ? .5 : 1 - i / (double)(n - 1);
                var b = Balance(id, perf); z.c += b.res;
                if (Rng.U() < .06)
                {
                    bool bad = Rng.U() < .72; double amt = Math.Round(b.rev * (bad ? 0.08 + Rng.U() * Rng.U() * 0.6 : 0.06 + Rng.U() * 0.2) / 1e3) * 1e3;
                    string why = bad ? Rng.Pick(new[] { "Steuernachzahlung", "Ausfall des Hauptsponsors", "Stadionsanierung", "Strafe des Verbands" }) : Rng.Pick(new[] { "Neuer Großsponsor", "Erbschaft eines Gönners", "Verkauf von Vereinsgelände" });
                    z.c += bad ? -amt : amt; if (id == S.fav) log.Add(T(id).name + ": " + why + " (" + (bad ? "−" : "+") + Util.Money(amt) + ")");
                }
                if (z.d > 0) { double pay = Math.Min(z.d, Math.Max(z.d * .12, z.c > b.rev * .6 ? z.c - b.rev * .4 : 0)); if (z.c - pay > -b.ex * .05) { z.c -= pay; z.d -= pay; if (z.d < 1e3) { z.d = 0; z.ir = 0; } } }
                if (z.c < 0) { double got = TakeLoan(id, -z.c + b.ex * .08); if (got > 0 && id == S.fav) log.Add(T(id).name + " nimmt einen Kredit über " + Util.Money(got) + " auf, um zahlungsfähig zu bleiben"); }
                z.h.Insert(0, new FinH { season = S.season, rev = Math.Round(b.rev), ex = Math.Round(b.ex), res = Math.Round(b.res) }); if (z.h.Count > 15) z.h.RemoveAt(15);
                if (id == S.fav) log.Add(T(id).name + ": Saisonbilanz " + (b.res >= 0 ? "+" : "−") + Util.Money(Math.Abs(b.res)) + " · Kontostand " + Util.Money(z.c));
                if (z.c < 0 && id == S.fav)
                {
                    log.Add(T(id).name + " ist zahlungsunfähig – Insolvenz!");
                    if (IsCareer && C.club == id) { C.conf = Math.Max(0, C.conf - 30); }
                    z.c = 0; z.d *= .5;
                }
            }
            if (IsCareer && C.club >= 0) { var z = S.fin.FirstOrDefault(x => x.team == C.club); if (z != null && z.h.Count > 0 && z.h[0].res < 0) C.conf = Math.Max(0, C.conf - 4); }
        }
    }
}
