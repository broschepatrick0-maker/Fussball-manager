// Oberfläche für Pokale und Europapokal: Übersicht, einzelner Pokal (Runde für Runde), Europapokal (Ligaphase und K.-o.-Runden), Titel eines Vereins.
using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;
using FP.Core;

namespace FP.UI
{
    public partial class App
    {
        string viewCup; int viewCupRound = -1; string viewEuro; bool euroKo; bool showAllCups;

        static string ScoreText(CupMatch m)
        {
            if (m.bye) return "Freilos";
            if (m.hg < 0) return "– : –";
            string s = m.hg + " : " + m.ag;
            if (m.ph >= 0) s += "\ni.E. " + m.ph + ":" + m.pa; else if (m.et) s += "\nn.V.";
            return s;
        }
        string Stage(Cup c)
        {
            if (c.winner >= 0) return "Sieger: " + G.T(c.winner).name;
            if (c.played == 0) return "1. Runde · " + (c.dates.Count > 0 ? "Spieltag " + c.dates[0] : "");
            return Game.RoundName(c.R, c.played) + (c.played < c.dates.Count ? " · Spieltag " + c.dates[c.played] : "");
        }
        string Stage(Euro e)
        {
            if (e.winner >= 0) return "Sieger: " + G.T(e.winner).name;
            if (e.step < e.nmd) return "Ligaphase · " + e.step + "/" + e.nmd + " Spieltage";
            int k = e.step - e.nmd; return k < Game.KoNames.Length ? Game.KoNames[k] + " als Nächstes" : "";
        }

        // Spielzeile für K.-o.-Spiele (mit n.V. / i.E.); der Sieger wird hervorgehoben
        void CupLine(Transform p, CupMatch m, bool big, int fav = -1)
        {
            var r = K.HBox(p, big ? 130 : 96, 14);
            var h = G.T(m.h);
            bool hw = m.w >= 0 && m.w == m.h && !m.bye, aw = m.w >= 0 && m.a >= 0 && m.w == m.a;
            K.Cell(r, h.name, -1, TextAnchor.MiddleRight, m.h == fav ? K.Acc : K.Txt, hw || m.h == G.S.fav ? FontStyle.Bold : FontStyle.Normal, big ? 36 : 32);
            K.Crest(r, h, big ? 90 : 60);
            Color col = K.Txt;
            if (fav >= 0 && m.w >= 0 && !m.bye) col = m.w == fav ? K.Up : K.Down;
            K.Cell(r, ScoreText(m), big ? 170 : 150, TextAnchor.MiddleCenter, col, FontStyle.Bold, m.et || m.ph >= 0 ? (big ? 34 : 28) : (big ? 44 : 34));
            if (m.a >= 0)
            {
                var a = G.T(m.a);
                K.Crest(r, a, big ? 90 : 60);
                K.Cell(r, a.name, -1, TextAnchor.MiddleLeft, m.a == fav ? K.Acc : K.Txt, aw || m.a == G.S.fav ? FontStyle.Bold : FontStyle.Normal, big ? 36 : 32);
            }
            else K.Cell(r, "", -1);
        }

        void CupButton(Transform p, Cup c)
        {
            var r = K.HBox(p, 110, 16, 20, K.Card2);
            var v = K.VBox(r, 2); K.LE(v, -1, -1, 1);
            K.Cell(v, c.name, -1, TextAnchor.MiddleLeft, K.Txt, FontStyle.Bold, 34).GetComponent<LayoutElement>().preferredHeight = 48;
            K.Cell(v, Stage(c) + " · " + c.teams.Count + " Teams", -1, TextAnchor.MiddleLeft, c.winner >= 0 ? K.Gold : K.Mut, FontStyle.Normal, 28).GetComponent<LayoutElement>().preferredHeight = 40;
            var id = c.id; K.Click(r, () => { viewCup = id; viewCupRound = -1; Go("cup"); });
        }
        void EuroButton(Transform p, Euro e)
        {
            var r = K.HBox(p, 110, 16, 20, K.Card2);
            var v = K.VBox(r, 2); K.LE(v, -1, -1, 1);
            K.Cell(v, e.name, -1, TextAnchor.MiddleLeft, K.Txt, FontStyle.Bold, 34).GetComponent<LayoutElement>().preferredHeight = 48;
            K.Cell(v, Stage(e), -1, TextAnchor.MiddleLeft, e.winner >= 0 ? K.Gold : K.Mut, FontStyle.Normal, 28).GetComponent<LayoutElement>().preferredHeight = 40;
            var id = e.id; K.Click(r, () => { viewEuro = id; euroKo = e.step > e.nmd; Go("euro"); });
        }

        // ---------- Übersicht ----------
        void CupsTab()
        {
            int fav = G.S.fav;
            // Mein Verein
            var mine = G.S.cups.Where(c => c.teams.Contains(fav)).ToList(); var mineE = G.S.euro.Where(e => e.teams.Contains(fav)).ToList();
            var pcols = K.Columns(content, 32, 1.2f, 1);
            var mc = K.CardBox(pcols[0], 24, 10);
            K.Kicker(mc, "Mein Verein im Pokal");
            if (mine.Count == 0 && mineE.Count == 0) K.Label(mc, G.T(fav).name + " spielt in dieser Saison in keinem Pokal.", K.FSs, K.Mut);
            foreach (var c in mine)
            {
                var r = K.HBox(mc, 80, 12); K.Cell(r, c.name, -1, TextAnchor.MiddleLeft, K.Txt, FontStyle.Normal, 32);
                string reach = G.CupReach(c, fav) ?? "–";
                bool alive = c.winner == fav || (c.winner < 0 && c.played < c.rounds.Count && c.rounds[c.played].m.Any(m => m.h == fav || m.a == fav));
                bool out_ = !alive;
                K.Cell(r, reach + (out_ ? " (raus)" : c.winner == fav ? " ★" : " · dabei"), 360, TextAnchor.MiddleRight, c.winner == fav ? K.Gold : out_ ? K.Mut : K.Up, FontStyle.Bold, 30);
                var cid = c.id; K.Click(r, () => { viewCup = cid; viewCupRound = -1; Go("cup"); });
            }
            foreach (var e in mineE)
            {
                var r = K.HBox(mc, 80, 12); K.Cell(r, e.name, -1, TextAnchor.MiddleLeft, K.Txt, FontStyle.Normal, 32);
                K.Cell(r, G.EuroReach(e, fav), 360, TextAnchor.MiddleRight, e.winner == fav ? K.Gold : K.Up, FontStyle.Bold, 30);
                var eid = e.id; K.Click(r, () => { viewEuro = eid; euroKo = e.step > e.nmd; Go("euro"); });
            }
            var games = G.CupGamesOf(fav);
            if (games.Count > 0)
            {
                K.Label(mc, "Spiele", 28, K.Mut);
                foreach (var x in games) { K.Label(mc, x.comp + " · " + x.round + " · Spieltag " + x.day, 26, K.Mut); CupLine(mc, x.m, false, fav); }
            }
            // National
            var nc = K.CardBox(pcols[1], 24, 10); K.Kicker(nc, "National");
            var dfb = G.CupById("dfb"); if (dfb != null) CupButton(nc, dfb);
            // Europa
            var ec = K.CardBox(pcols[1], 24, 10); K.Kicker(ec, "Europapokal");
            foreach (var e in G.S.euro) EuroButton(ec, e);
            // Landes- und Kreispokale
            var lc = K.CardBox(pcols[1], 24, 10); K.Kicker(lc, "Landespokale");
            var favVb = G.T(fav).vb;
            var lps = G.S.cups.Where(c => c.type == "lp").OrderBy(c => c.vb == favVb ? 0 : 1).ThenBy(c => c.name).ToList();
            foreach (var c in showAllCups ? lps : lps.Take(4).ToList()) CupButton(lc, c);
            var kps = G.S.cups.Where(c => c.type == "kp").OrderBy(c => c.teams.Contains(fav) ? 0 : c.vb == favVb ? 1 : 2).ThenBy(c => c.name).ToList();
            if (kps.Count > 0)
            {
                var kc = K.CardBox(pcols[1], 24, 10); K.Kicker(kc, "Kreispokale (" + kps.Count + ")");
                foreach (var c in showAllCups ? kps : kps.Take(4).ToList()) CupButton(kc, c);
            }
            if (!showAllCups) K.Btn(pcols[1], "Alle Landes- und Kreispokale zeigen", () => { showAllCups = true; Render(); }, K.Card2, 100);
        }

        // ---------- Ein Pokal ----------
        void CupTab()
        {
            var c = G.CupById(viewCup) ?? G.CupById("dfb"); if (c == null) { Go("cups"); return; }
            viewCup = c.id;
            if (viewCupRound < 0 || viewCupRound >= c.rounds.Count) viewCupRound = Mathf.Clamp(c.played >= c.rounds.Count ? c.rounds.Count - 1 : c.played, 0, c.rounds.Count - 1);
            var hc = K.CardBox(content, 28, 6);
            K.Head(hc, c.name, K.Desk ? 76 : 60);
            K.Label(hc, c.teams.Count + " Teams · " + c.R + " Runden · " + Stage(c), K.FSs, c.winner >= 0 ? K.Gold : K.Mut);
            if (c.winner >= 0)
            {
                var wr = K.HBox(hc, 120, 20); K.Crest(wr, G.T(c.winner), 100); K.Label(wr, "★ " + G.T(c.winner).name, 44, K.Gold, TextAnchor.MiddleLeft, FontStyle.Bold);
            }
            var nav = K.HBox(content, 110, 16);
            K.Btn(nav, "◀", () => { viewCupRound = Mathf.Max(0, viewCupRound - 1); Render(); }, K.Card2, 110, 140, 44);
            int day = viewCupRound < c.dates.Count ? c.dates[viewCupRound] : 0;
            K.Cell(nav, Game.RoundName(c.R, viewCupRound) + " · Spieltag " + day, -1, TextAnchor.MiddleCenter, K.Txt, FontStyle.Bold, 36);
            K.Btn(nav, "▶", () => { viewCupRound = Mathf.Min(c.rounds.Count - 1, viewCupRound + 1); Render(); }, K.Card2, 110, 140, 44);
            var rc = K.CardBox(content, 16, 6);
            var rd = c.rounds[viewCupRound];
            var games = rd.m.Where(m => !m.bye).OrderBy(m => m.h == G.S.fav || m.a == G.S.fav ? 0 : 1).ThenBy(m => -Math.Max(G.T(m.h).r, G.T(m.a).r)).ToList();
            foreach (var m in games) CupLine(rc, m, false, m.h == G.S.fav || m.a == G.S.fav ? G.S.fav : -1);
            var byes = rd.m.Where(m => m.bye).ToList();
            if (byes.Count > 0) K.Label(rc, "Freilos: " + string.Join(", ", byes.Select(m => G.T(m.h).name)), 28, K.Mut);
            if (viewCupRound >= c.played && c.winner < 0) K.Label(content, "Die Runde wird am Spieltag " + day + " gespielt.", 28, K.Mut, TextAnchor.MiddleCenter);
            K.Btn(content, "◀  Alle Pokale", () => Go("cups"), K.Card2, 100);
        }

        // ---------- Europapokal ----------
        void EuroTab()
        {
            var e = G.EuroById(viewEuro) ?? G.EuroById("ucl"); if (e == null) { Go("cups"); return; }
            viewEuro = e.id;
            var hc = K.CardBox(content, 28, 6);
            K.Head(hc, e.name, K.Desk ? 76 : 60);
            K.Label(hc, e.teams.Count + " Teams · " + Stage(e), K.FSs, e.winner >= 0 ? K.Gold : K.Mut);
            if (e.winner >= 0) { var wr = K.HBox(hc, 120, 20); K.Crest(wr, G.T(e.winner), 100); K.Label(wr, "★ " + G.T(e.winner).name, 44, K.Gold, TextAnchor.MiddleLeft, FontStyle.Bold); }
            var sw = K.HBox(content, 100, 16);
            K.Btn(sw, "Ligaphase", () => { euroKo = false; Render(); }, euroKo ? K.Card2 : K.AccD, 100, -1, 34, euroKo ? K.Mut : Color.white);
            K.Btn(sw, "K.-o.-Runden", () => { euroKo = true; Render(); }, euroKo ? K.AccD : K.Card2, 100, -1, 34, euroKo ? Color.white : K.Mut);
            if (!euroKo)
            {
                var tb = G.EuroTable(e);
                var c = K.CardBox(content, 16, 0);
                var h = K.HBox(c, 60, 10, 8);
                K.Cell(h, "#", 64, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 28); K.Cell(h, "", 56, TextAnchor.MiddleCenter);
                K.Cell(h, "Verein", -1, TextAnchor.MiddleLeft, K.Mut, FontStyle.Normal, 28);
                K.Cell(h, "Sp", 64, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 28); K.Cell(h, "Diff", 84, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 28); K.Cell(h, "Pkt", 84, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 28);
                for (int i = 0; i < tb.Count; i++)
                {
                    var row = tb[i]; var t = G.T(row.id); bool me = row.id == G.S.fav;
                    var r = K.HBox(c, 78, 10, 8, me ? K.Card2 : (Color?)null);
                    var bar = K.Rect("Zone", r); bar.gameObject.AddComponent<Image>().color = i < 8 ? K.Up : i < 24 ? K.Rel : new Color(0, 0, 0, 0); K.LE(bar, 8, 60);
                    K.Cell(r, (i + 1).ToString(), 48, TextAnchor.MiddleCenter, K.Mut);
                    K.Crest(r, t, 52);
                    K.Cell(r, t.name, -1, TextAnchor.MiddleLeft, me ? K.Acc : K.Txt, me ? FontStyle.Bold : FontStyle.Normal, 32);
                    K.Cell(r, row.sp.ToString(), 64, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 30);
                    K.Cell(r, (row.Diff > 0 ? "+" : "") + row.Diff, 84, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 30);
                    K.Cell(r, row.p.ToString(), 84, TextAnchor.MiddleCenter, K.Txt, FontStyle.Bold, 32);
                    int id = row.id; K.Click(r, () => { viewTeam = id; Go("team"); });
                }
                var lg = K.HBox(content, 60, 24); Legend(lg, K.Up, "Achtelfinale"); Legend(lg, K.Rel, "Play-offs");
                // Spiele von Mein Verein / letzter Spieltag
                int md = Mathf.Clamp(e.step - 1, 0, Math.Max(0, e.mds.Count - 1));
                if (e.mds.Count > 0 && e.step > 0 && e.step <= e.nmd)
                {
                    var mc = K.CardBox(content, 16, 6); K.Label(mc, (md + 1) + ". Spieltag", K.FSs, K.Mut);
                    foreach (var m in e.mds[md].m.OrderBy(m => m.h == G.S.fav || m.a == G.S.fav ? 0 : 1)) MatchLine(mc, m, false, m.h == G.S.fav || m.a == G.S.fav ? G.S.fav : -1);
                }
            }
            else
            {
                if (e.ko.Count == 0) K.Label(content, "Die K.-o.-Runden beginnen nach dem " + e.nmd + ". Spieltag der Ligaphase (Spieltag " + (e.nmd < e.dates.Count ? e.dates[e.nmd] : 0) + ").", K.FSs, K.Mut, TextAnchor.MiddleCenter);
                for (int k = e.ko.Count - 1; k >= 0; k--)
                {
                    var ko = e.ko[k]; var c = K.CardBox(content, 16, 6);
                    K.Kicker(c, ko.name);
                    foreach (var t in ko.ties.OrderBy(x => x.a == G.S.fav || x.b == G.S.fav ? 0 : 1))
                    {
                        int f = t.a == G.S.fav || t.b == G.S.fav ? G.S.fav : -1;
                        if (!t.twoLegs) { CupLine(c, t.l1, false, f); continue; }
                        CupLine(c, t.l1, false, f); CupLine(c, t.l2, false, f);
                        K.Label(c, "Gesamt " + t.ga + ":" + t.gb + (t.pa >= 0 ? ", i.E. " + t.pa + ":" + t.pb : "") + " · weiter: " + G.T(t.w).name, 28, f >= 0 ? (t.w == f ? K.Up : K.Down) : K.Mut, TextAnchor.MiddleCenter);
                        K.Divider(c);
                    }
                }
            }
            K.Btn(content, "◀  Alle Pokale", () => Go("cups"), K.Card2, 100);
        }

        // ---------- Titel und Pokalläufe eines Vereins ----------
        void TitlesCard(int id, Transform where = null)
        {
            var tl = G.TitlesOf(id);
            var c = K.CardBox(where ?? content, 24, 8);
            K.Kicker(c, "Erfolge");
            if (tl.Count == 0) { K.Label(c, "Noch kein Titel seit Spielbeginn.", K.FSs, K.Mut); return; }
            foreach (var g in tl.GroupBy(t => t.comp).OrderBy(x => x.First().lv).ThenByDescending(x => x.Count()))
            {
                var r = K.HBox(c, 76, 12);
                K.Cell(r, "★", 60, TextAnchor.MiddleCenter, K.Gold, FontStyle.Normal, 34);
                K.Cell(r, g.Key, -1, TextAnchor.MiddleLeft, K.Txt, FontStyle.Bold, 32);
                K.Cell(r, g.Count() + "×", 90, TextAnchor.MiddleRight, K.Gold, FontStyle.Bold, 32);
                K.Label(c, string.Join(", ", g.Select(t => Sl(t.season))), 26, K.Mut);
            }
        }
        void CupRunsCard(int id, Transform where = null)
        {
            var cs = G.S.cups.Where(x => x.teams.Contains(id)).ToList(); var es = G.S.euro.Where(x => x.teams.Contains(id)).ToList();
            if (cs.Count == 0 && es.Count == 0) return;
            var c = K.CardBox(where ?? content, 24, 8); K.Kicker(c, "Pokale in dieser Saison");
            foreach (var x in cs) { var r = K.HBox(c, 72, 12); K.Cell(r, x.name, -1, TextAnchor.MiddleLeft, K.Txt, FontStyle.Normal, 30); K.Cell(r, G.CupReach(x, id) ?? "–", 340, TextAnchor.MiddleRight, x.winner == id ? K.Gold : K.Mut, FontStyle.Bold, 30); var cid = x.id; K.Click(r, () => { viewCup = cid; viewCupRound = -1; Go("cup"); }); }
            foreach (var x in es) { var r = K.HBox(c, 72, 12); K.Cell(r, x.name, -1, TextAnchor.MiddleLeft, K.Txt, FontStyle.Normal, 30); K.Cell(r, G.EuroReach(x, id), 340, TextAnchor.MiddleRight, x.winner == id ? K.Gold : K.Mut, FontStyle.Bold, 30); var eid = x.id; K.Click(r, () => { viewEuro = eid; euroKo = x.step > x.nmd; Go("euro"); }); }
        }
    }
}
