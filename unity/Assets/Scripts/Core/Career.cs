// Spielmodi: Freies Spiel und Karriere (Vorstand, Saisonziel, Vertrauen, Entlassung, Ruf, Jobangebote,
// Bewerbungen, Trainerlizenzen). Übertragen aus der Web-App (08d-career.js).
using System;
using System.Collections.Generic;
using System.Linq;

namespace FP.Core
{
    [Serializable] public class Goal { public string lg; public int pos; public int exp; public string label; public int season; }
    [Serializable] public class Offer { public int club; public int s; }
    [Serializable] public class CStats { public int g, w, d, l; public List<string> titles = new List<string>(); }
    [Serializable] public class CHist { public int club; public string name; public int from, to, g, w, d, l; public string titles; public string end; }
    [Serializable]
    public class Career
    {
        public string name = "Trainer"; public int club = -1; public float rep; public float conf = 60;
        public Goal goal; public bool hasGoal; public List<Offer> offers = new List<Offer>(); public bool jobless = true;
        public List<CHist> hist = new List<CHist>(); public int started; public int lic; public double money; public int course = -1; public float courseLeft;
        public string start = "club"; public CStats stats = new CStats(); public int since; public int grace;
        public List<string> applied = new List<string>(); public List<int> vac = new List<int>(); public int vacS = -1;
    }
    public class Lic { public string k, n; public int min, dur, cost, rep, seasons; public float exam = 1; }

    public partial class Game
    {
        public static readonly Dictionary<int, int> ReqRep = new Dictionary<int, int> { { 1, 82 }, { 2, 66 }, { 3, 54 }, { 4, 42 }, { 5, 32 }, { 6, 22 }, { 7, 12 }, { 8, 0 }, { 9, 0 }, { 10, 0 }, { 11, 0 }, { 12, 0 } };
        public static readonly Dictionary<int, double> Salary = new Dictionary<int, double> { { 1, 1.6e6 }, { 2, 4.2e5 }, { 3, 1.6e5 }, { 4, 6e4 }, { 5, 2.4e4 }, { 6, 1e4 }, { 7, 4500 }, { 8, 1800 }, { 9, 1000 }, { 10, 600 }, { 11, 400 }, { 12, 300 } };
        public static readonly Lic[] Lics = {
            new Lic { k = "0", n = "Keine Lizenz", min = 8 },
            new Lic { k = "C", n = "C-Lizenz", min = 7, dur = 10, cost = 600 },
            new Lic { k = "B", n = "B-Lizenz", min = 5, dur = 18, cost = 2500, rep = 12 },
            new Lic { k = "A", n = "A-Lizenz", min = 4, dur = 28, cost = 7500, rep = 28, seasons = 1 },
            new Lic { k = "P", n = "Pro-Lizenz (Fußballlehrer)", min = 1, dur = 38, cost = 22000, rep = 42, seasons = 2, exam = .8f } };

        public bool IsCareer { get { return S.mode == "career" && S.career != null; } }
        public Career C { get { return S.career; } }
        public int LvOf(int id) { var l = LeagueOf(id); return l == null ? 9 : l.foreign ? 1 : l.level; }
        public bool LicOk(int lv) { return lv >= Lics[Math.Min(Lics.Length - 1, C.lic)].min; }
        public static string LicRange(int i) { int m = Lics[i].min; return m == 1 ? "alle Ligen" : m == 8 ? "Kreisliga und tiefer" : "ab Stufe " + m + " abwärts"; }
        public static string RepLabel(float r) { return r >= 85 ? "Weltklasse" : r >= 70 ? "International gefragt" : r >= 55 ? "Bundesweit bekannt" : r >= 40 ? "Regional bekannt" : r >= 20 ? "Lokal bekannt" : "Unbeschriebenes Blatt"; }
        public static string ConfLabel(float v) { return v >= 75 ? "Volles Vertrauen" : v >= 55 ? "Zufrieden" : v >= 38 ? "Skeptisch" : v >= 22 ? "Unruhig – es wird eng" : "Akut gefährdet"; }
        static string Sl2(int s) { return s + "/" + ((s + 1) % 100).ToString("00"); }
        public List<string> Events = new List<string>();   // Meldungen für die Oberfläche (Entlassung, Angebote, Lizenz)

        // ---------- Start ----------
        public void NewCareer(string name, int club, string start)
        {
            S.mode = "career";
            int lic = start == "zero" ? 0 : start == "pro" ? 2 : Math.Max(0, Array.FindIndex(Lics, l => (club >= 0 ? LvOf(club) : 9) >= l.min));
            float rep = start == "zero" ? 2 : start == "pro" ? 24 : Math.Max(5, ReqRep[club >= 0 ? LvOf(club) : 9] + 3);
            S.career = new Career { name = string.IsNullOrEmpty(name) ? "Trainer" : name, rep = rep, lic = lic, started = S.season, start = start, money = start == "zero" ? 3000 : start == "pro" ? 250000 : 20000 };
            if (club >= 0) TakeJob(club, true);
            else { S.fav = -1; C.offers = JobOffers(2, true); }
        }
        public void NewFree(int club) { S.mode = "free"; S.career = null; S.fav = club; }

        public void TakeJob(int club, bool first = false)
        {
            var c = C; if (c.club >= 0 && c.club != club) EndJob("gewechselt");
            c.club = club; c.jobless = false; c.conf = 60; c.since = S.season; c.offers.Clear(); c.stats = new CStats(); c.grace = 0;
            S.fav = club; Squad(club); SetGoal();
            if (!first) Events.Add(T(club).name + " stellt " + c.name + " als neuen Trainer vor. Ziel des Vorstands: " + (c.hasGoal ? c.goal.label : "eine stabile Saison") + ".");
        }
        void EndJob(string why)
        {
            var c = C; if (c == null || c.club < 0) return; var st = c.stats;
            c.hist.Insert(0, new CHist { club = c.club, name = T(c.club).name, from = c.since, to = S.season, g = st.g, w = st.w, d = st.d, l = st.l, titles = string.Join(", ", st.titles.ToArray()), end = why });
        }

        // Saisonziel aus der erwarteten Platzierung
        string ZoneKind(League l, int i, int n)
        {
            if (l.id == "bl" || l.foreign) return i < 4 ? "cl" : i < 7 ? "el" : (l.id == "bl" && i >= 16) || (l.foreign && i >= n - 3) ? "down" : "";
            int z = Zone(l, i, n); return z == 1 ? "up" : z == -1 ? "down" : "";
        }
        public void SetGoal()
        {
            var c = C; if (c == null || c.club < 0) return; var lg = LeagueOf(c.club); if (lg == null) { c.hasGoal = false; return; }
            var order = lg.teams.OrderByDescending(x => EffR(x)).ToList(); int e = order.IndexOf(c.club) + 1, n = lg.teams.Count;
            int target = Math.Min(n, e + (e <= 2 ? 0 : e <= n / 2 ? 1 : 2));
            while (target > 1 && ZoneKind(lg, target - 1, n) == "down") target--;
            string z = ZoneKind(lg, target - 1, n);
            string label = target == 1 ? (lg.level == 1 && !lg.foreign ? "Deutsche Meisterschaft" : "Meisterschaft") : z == "up" ? "Aufstieg" : z == "cl" ? "Champions-League-Platz" : z == "el" ? "Europapokal-Platz" : target <= Math.Ceiling(n / 2.0) ? "Obere Tabellenhälfte" : target >= n - 4 ? "Klassenerhalt" : "Gesichertes Mittelfeld";
            c.goal = new Goal { lg = lg.id, pos = target, exp = e, label = label, season = S.season }; c.hasGoal = true;
        }

        // Wahrscheinlichkeiten Sieg/Remis/Niederlage aus dem Tormodell
        public double[] MatchProb(int h, int a)
        {
            double lh = Lam(EffR(h), EffR(a), true), la = Lam(EffR(a), EffR(h), false);
            double ph = 0, pd = 0, pa = 0;
            Func<double, int, double> P = (l, k) => { double r = Math.Exp(-l); for (int i = 1; i <= k; i++) r *= l / i; return r; };
            for (int x = 0; x <= 10; x++) for (int y = 0; y <= 10; y++) { double p = P(lh, x) * P(la, y); if (x > y) ph += p; else if (x == y) pd += p; else pa += p; }
            double s = ph + pd + pa; return new[] { ph / s, pd / s, pa / s };
        }

        // nach jedem Ligaspiel von Mein Verein
        void CareerAfterMatch(Match m)
        {
            if (!IsCareer) return; var c = C; if (c.club < 0 || (m.h != c.club && m.a != c.club)) return;
            int me = m.h == c.club ? m.hg : m.ag, op = m.h == c.club ? m.ag : m.hg;
            var pr = MatchProb(m.h, m.a); double pw = m.h == c.club ? pr[0] : pr[2];
            double E = 3 * pw + pr[1]; int pts = me > op ? 3 : me == op ? 1 : 0;
            c.conf = (float)Math.Max(0, Math.Min(100, Math.Round(c.conf + (pts - E) * 2.6, 1)));
            c.stats.g++; if (pts == 3) c.stats.w++; else if (pts == 1) c.stats.d++; else c.stats.l++;
            var lg = LeagueOf(c.club); if (lg != null && lg.played >= 8 && c.conf < 12) FireCoach("Vertrauen aufgebraucht");
        }
        public void FireCoach(string why)
        {
            var c = C; if (c.club < 0) return; var t = T(c.club); EndJob("entlassen");
            Events.Add(t.name + " trennt sich von Trainer " + c.name + " (" + why + "). Unter „Verein“ findest du freie Stellen.");
            c.rep = Math.Max(0, c.rep - 6); c.club = -1; c.jobless = true; c.hasGoal = false; S.fav = -1; c.offers.Clear();
        }

        void CareerSeasonEnd(Dictionary<string, List<int>> st, List<string> log)
        {
            if (!IsCareer) return; var c = C;
            if (c.club >= 0) { int lv = LvOf(c.club); double sal; Salary.TryGetValue(lv, out sal); c.money += Math.Round((sal > 0 ? sal : 600) * (0.8 + c.rep / 250)); }
            if (c.club >= 0 && c.hasGoal)
            {
                var lg = L(c.goal.lg); int pos = st.ContainsKey(c.goal.lg) ? st[c.goal.lg].IndexOf(c.club) + 1 : 0; int diff = c.goal.pos - pos;
                c.conf = Math.Max(0, Math.Min(100, c.conf + (diff >= 0 ? 14 + 5 * Math.Min(diff, 4) : -11 * Math.Min(-diff, 5))));
                int lvl = lg != null ? (lg.foreign ? 1 : lg.level) : 8; double wt = Math.Max(1, 9 - lvl) / 4.0;
                double dr = (diff >= 0 ? 2 + diff : -2 + diff * 1.2) * wt;
                if (pos == 1) { dr += 6 * wt; c.stats.titles.Add(lg.name + " " + Sl2(S.season)); }
                foreach (var cu in S.cups.Where(x => x.winner == c.club)) { dr += cu.type == "dfb" ? 8 : 3; c.stats.titles.Add(cu.name + " " + Sl2(S.season)); }
                c.rep = (float)Math.Max(0, Math.Min(100, Math.Round(c.rep + dr, 1)));
                log.Add(c.name + " (" + T(c.club).name + "): Ziel " + c.goal.label + " (Platz " + c.goal.pos + ") – erreicht wurde Platz " + pos + ". Vertrauen des Vorstands: " + Math.Round(c.conf) + "/100");
                if (c.conf < 22) { FireCoach("Saisonziel klar verfehlt"); log.Add(c.name + " wurde entlassen"); return; }
                c.offers = JobOffers(diff >= 0 ? 2 : 1, false);
            }
            else if (c.jobless) c.offers = JobOffers(3, true);
        }
        // nach dem Saisonwechsel: Lizenzprüfung für die neue Liga, neues Ziel
        void CareerNewSeason(List<string> log)
        {
            if (!IsCareer) return; var c = C; if (c.club < 0) return;
            int nl = LvOf(c.club);
            if (!LicOk(nl))
            {
                if (c.grace > 0 && c.grace < S.season) { FireCoach("fehlende Trainerlizenz"); return; }
                if (c.grace == 0) { c.grace = S.season + 1; log.Add(c.name + ": Für Stufe " + nl + " fehlt die Lizenz – der Verband erteilt eine Ausnahmegenehmigung für eine Saison"); }
            }
            else c.grace = 0;
            SetGoal();
        }

        public List<Offer> JobOffers(int n, bool jobless)
        {
            var c = C; float rep = c.rep + (jobless ? 6 : 0); int cur = c.club >= 0 ? LvOf(c.club) : 9; var outL = new List<Offer>();
            var levels = ReqRep.Keys.Where(lv => ReqRep[lv] <= rep && LicOk(lv) && (jobless || lv < cur || (lv == cur && Rng.U() < .4))).OrderBy(x => x).Take(3).ToList();
            if (levels.Count == 0) return outL;
            for (int i = 0; i < n * 3 && outL.Count < n; i++)
            {
                int lv = Rng.Pick(levels); var ls = S.leagues.Where(l => !l.foreign && l.level == lv && !l.teams.Contains(c.club)).ToList(); if (ls.Count == 0) continue;
                var lg = Rng.Pick(ls); var tb = Standing(lg);
                var pool = (jobless ? tb.Skip(tb.Count / 2) : tb).Where(id => id != c.club && !IsRes(T(id).name) && !outL.Any(o => o.club == id)).ToList();
                if (pool.Count > 0) outL.Add(new Offer { club = Rng.Pick(pool), s = S.season });
            }
            return outL;
        }
        public void AcceptOffer(int i) { if (i < 0 || i >= C.offers.Count) return; TakeJob(C.offers[i].club); }

        void CareerDay()
        {
            if (!IsCareer) return; var c = C; CourseTick();
            if (c.jobless && Rng.U() < .18 && c.offers.Count < 4) { var o = JobOffers(1, true); c.offers.AddRange(o); if (o.Count > 0) Events.Add("Jobangebot: " + T(o[0].club).name + " möchte dich als Trainer"); }
            if (!c.jobless && c.offers.Count > 0 && S.day > 6) c.offers.Clear();
        }

        // ---------- Lizenzen ----------
        public int SeasonsCoached() { var c = C; return c.hist.Sum(h => Math.Max(0, h.to - h.from)) + (c.club >= 0 ? S.season - c.since : 0); }
        public string StartCourse()
        {
            var c = C; int i = c.lic + 1; if (i >= Lics.Length) return "Du hast bereits die höchste Lizenz"; if (c.course >= 0) return "Der Lehrgang läuft bereits";
            var L_ = Lics[i];
            if (c.rep < L_.rep) return "Dafür brauchst du mindestens " + L_.rep + " Ruf";
            if (SeasonsCoached() < L_.seasons) return "Dafür brauchst du " + L_.seasons + " " + (L_.seasons == 1 ? "Saison" : "Saisons") + " Erfahrung als Trainer";
            if (c.money < L_.cost) return "Der Lehrgang kostet " + Util.Money(L_.cost) + " – dein Konto reicht nicht";
            c.money -= L_.cost; c.course = i; c.courseLeft = L_.dur; return "ok";
        }
        void CourseTick()
        {
            var c = C; if (c == null || c.course < 0) return; c.courseLeft -= c.jobless ? 1.6f : 1; if (c.courseLeft > 0) return;
            var L_ = Lics[c.course];
            if (Rng.U() < L_.exam) { c.lic = c.course; c.rep = Math.Min(100, c.rep + 3); Events.Add(c.name + " besteht die " + L_.n + " – jetzt " + LicRange(c.lic) + "."); }
            else Events.Add(c.name + " fällt durch die Prüfung zur " + L_.n + ". Ein neuer Anlauf ist jederzeit möglich.");
            c.course = -1;
        }

        // ---------- Freie Stellen und Bewerbungen ----------
        public List<int> Vacancies()
        {
            var c = C; int key = S.season * 100 + S.day / 4;
            if (c.vacS != key)
            {
                c.vacS = key; var lvls = Enumerable.Range(1, 12).Where(lv => LicOk(lv) && ReqRep[lv] <= c.rep + 22).OrderBy(x => x).Take(5).ToList(); var outL = new List<int>();
                for (int i = 0; i < 16 && outL.Count < 6 && lvls.Count > 0; i++)
                {
                    int lv = Rng.Pick(lvls); var ls = S.leagues.Where(l => !l.foreign && l.level == lv).ToList(); if (ls.Count == 0) continue;
                    var tb = Standing(Rng.Pick(ls)); var cand = tb.Skip((int)(tb.Count * .4)).ToList(); if (cand.Count == 0) continue;
                    int id = Rng.Pick(cand); if (!IsRes(T(id).name) && !outL.Contains(id) && id != c.club) outL.Add(id);
                }
                c.vac = outL;
            }
            return c.vac;
        }
        public double ApplyChance(int id)
        {
            int lv = LvOf(id); var c = C; double p = .35 + (c.rep - ReqRep[lv]) / 35.0;
            if (!Vacancies().Contains(id)) { var lg = LeagueOf(id); var tb = lg != null ? Standing(lg) : new List<int>(); int pos = tb.IndexOf(id), n = Math.Max(1, tb.Count); p *= pos >= 0 && lg.played >= 6 ? .15 + .45 * pos / n : .25; }
            if (c.club >= 0 && lv > LvOf(c.club)) p *= 1.3;
            return Math.Max(.02, Math.Min(.92, p));
        }
        public bool CanApply(int id, out string why)
        {
            why = null; var lg = LeagueOf(id);
            if (!IsCareer || lg == null || lg.foreign || IsRes(T(id).name) || C.club == id) { why = ""; return false; }
            if (C.applied.Contains(id + ":" + S.season)) { why = "Bewerbung abgelehnt"; return false; }
            if (!LicOk(LvOf(id))) { why = "Lizenz fehlt"; return false; }
            return true;
        }
        public string ApplyJob(int id)
        {
            var c = C; if (!LicOk(LvOf(id))) return "lizenz"; string k = id + ":" + S.season; if (c.applied.Contains(k)) return "schon"; c.applied.Add(k);
            if (Rng.U() < ApplyChance(id)) { TakeJob(id); return "ok"; }
            return "nein";
        }
    }
}
