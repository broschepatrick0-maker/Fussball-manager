// Oberfläche im Aufbau der Web-App: Anzeigetafel oben, Bereichsleiste links (Handy: unten),
// Inhalte als Karten. Bereiche: Start, News, Verein, Ligen, Europa, Historie.
using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;
using FP.Core;

namespace FP.UI
{
    public class App : MonoBehaviour
    {
        Game G;
        RectTransform shell, board, rail, content, resultsBox;
        ScrollRect scroll; CanvasScaler scaler; RectTransform canvasRT;
        bool wide, shellBuilt; float contentW = 1200;
        string area = "title", lastKey = "";
        string viewCup; bool lpOpen; string newMode = "career", careerStart = "club", coachName = ""; string favSub = "ov"; int viewTeam = -1; string viewLeague; int viewRound = -1; string vbView; bool vbOpen; string query = "";
        bool showAllLog, confirmNew; string error;
        Vector2 lastScreen; Rect lastSafe;

        const float BoardH = 52, RailW = 76, RailH = 58;
        static readonly Color CL = K.Hex("#6f9be8"), EL = K.Hex("#f0954a"), ECL = K.Hex("#4cc3b8");
        static readonly Dictionary<string, string> VB = new Dictionary<string, string> {
            {"BY","Bayern"},{"BA","Baden"},{"SB","Südbaden"},{"WU","Württemberg"},{"HE","Hessen"},{"SW","Südwest"},{"RL","Rheinland"},{"SL","Saarland"},
            {"MR","Mittelrhein"},{"NR","Niederrhein"},{"WF","Westfalen"},{"NI","Niedersachsen"},{"HB","Bremen"},{"HH","Hamburg"},{"SH","Schleswig-Holstein"},
            {"MV","Mecklenburg-Vorpommern"},{"BB","Brandenburg"},{"BE","Berlin"},{"ST","Sachsen-Anhalt"},{"SN","Sachsen"},{"TH","Thüringen"} };
        static readonly string[][] Areas = { new[] { "home", "Start", "home" }, new[] { "news", "News", "news" }, new[] { "fav", "Verein", "star" }, new[] { "de", "Ligen", "ligen" }, new[] { "eu", "Europa", "europa" }, new[] { "cups", "Pokale", "pokal" }, new[] { "hist", "Historie", "hist" } };
        static readonly Dictionary<string, string> ShortName = new Dictionary<string, string> { { "bl", "Bundesliga" }, { "bl2", "2. BL" }, { "l3", "3. Liga" }, { "rln", "RL Nord" }, { "rlno", "RL Nordost" }, { "rlw", "RL West" }, { "rlsw", "RL Südwest" }, { "rlby", "RL Bayern" } };

        // ================= Gerüst =================
        void Start()
        {
            K.Init();
            var cgo = new GameObject("Canvas", typeof(RectTransform));
            cgo.transform.SetParent(transform, false);
            var canvas = cgo.AddComponent<Canvas>(); canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            scaler = cgo.AddComponent<CanvasScaler>(); scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            cgo.AddComponent<GraphicRaycaster>();
            canvasRT = (RectTransform)cgo.transform;
            var bg = K.Rect("Hintergrund", canvasRT); K.Fill(bg); bg.gameObject.AddComponent<Image>().color = K.Bg;
            shell = K.Rect("Gerüst", canvasRT); K.Fill(shell);
            CheckScreen(true);
        }

        void Update() { CheckScreen(false); Keys(); }

        void Keys()
        {
#if ENABLE_LEGACY_INPUT_MANAGER
            if (G == null || (G.S.fav < 0 && !G.IsCareer)) return;
            var es = UnityEngine.EventSystems.EventSystem.current;
            bool typing = es != null && es.currentSelectedGameObject != null && es.currentSelectedGameObject.GetComponent<InputField>() != null;
            if (typing) return;
            if (Input.GetKeyDown(KeyCode.Escape) && area != "home") Go("home");
            if (Input.GetKeyDown(KeyCode.Space)) Next();
#endif
        }

        // Querformat = PC-Aufbau (Maßstab wie 1600×900 im Browser), Hochformat = Handy-Aufbau (wie 412 px breit)
        void CheckScreen(bool force)
        {
            var scr = new Vector2(Screen.width, Screen.height);
            if (!force && scr == lastScreen && Screen.safeArea == lastSafe) return;
            lastScreen = scr; lastSafe = Screen.safeArea;
            bool w = Screen.width > Screen.height * 1.15f;
            scaler.referenceResolution = w ? new Vector2(1600, 900) : new Vector2(412, 915);
            scaler.matchWidthOrHeight = w ? .5f : 0;
            Canvas.ForceUpdateCanvases();
            float ch = canvasRT.rect.height;
            var sa = Screen.safeArea; float top = (Screen.height - sa.yMax) / Mathf.Max(1, Screen.height) * ch, bot = sa.yMin / Mathf.Max(1, Screen.height) * ch;
            shell.offsetMin = new Vector2(0, bot); shell.offsetMax = new Vector2(0, -top);
            bool rebuild = w != wide || !shellBuilt; wide = w;
            if (rebuild) BuildShell();
            float avail = canvasRT.rect.width - (wide ? RailW : 0);
            contentW = wide ? Mathf.Min(avail - 28, 1212) : avail - 20;
            var vlg = content.GetComponent<VerticalLayoutGroup>();
            int padR = wide ? Mathf.Max(14, Mathf.RoundToInt(avail - 14 - contentW)) : 10;
            vlg.padding = new RectOffset(wide ? 14 : 10, padR, wide ? 14 : 10, 40);
            Render();
        }

        void BuildShell()
        {
            shellBuilt = true; K.Clear(shell);
            // Anzeigetafel
            board = K.Rect("Anzeigetafel", shell); board.anchorMin = new Vector2(0, 1); board.anchorMax = new Vector2(1, 1); board.pivot = new Vector2(.5f, 1); board.sizeDelta = new Vector2(0, BoardH);
            board.gameObject.AddComponent<Image>().color = K.Board;
            var bh = board.gameObject.AddComponent<HorizontalLayoutGroup>(); bh.padding = new RectOffset(wide ? 20 : 12, wide ? 20 : 10, 0, 0); bh.spacing = wide ? 16 : 10; bh.childAlignment = TextAnchor.MiddleLeft;
            bh.childControlWidth = true; bh.childControlHeight = true; bh.childForceExpandWidth = false; bh.childForceExpandHeight = false;
            // Bereichsleiste
            rail = K.Rect("Bereiche", shell);
            if (wide) { rail.anchorMin = new Vector2(0, 0); rail.anchorMax = new Vector2(0, 1); rail.pivot = new Vector2(0, 1); rail.offsetMin = new Vector2(0, 0); rail.offsetMax = new Vector2(RailW, -BoardH); }
            else { rail.anchorMin = new Vector2(0, 0); rail.anchorMax = new Vector2(1, 0); rail.pivot = new Vector2(.5f, 0); rail.sizeDelta = new Vector2(0, RailH); }
            rail.gameObject.AddComponent<Image>().color = K.Panel;
            var edge = K.Rect("Linie", rail); edge.gameObject.AddComponent<Image>().color = K.Line; var le = edge.gameObject.AddComponent<LayoutElement>(); le.ignoreLayout = true;
            if (wide) { edge.anchorMin = new Vector2(1, 0); edge.anchorMax = new Vector2(1, 1); edge.sizeDelta = new Vector2(1, 0); edge.anchoredPosition = new Vector2(-.5f, 0); }
            else { edge.anchorMin = new Vector2(0, 1); edge.anchorMax = new Vector2(1, 1); edge.sizeDelta = new Vector2(0, 1); edge.anchoredPosition = new Vector2(0, -.5f); }
            HorizontalOrVerticalLayoutGroup rl = wide ? (HorizontalOrVerticalLayoutGroup)rail.gameObject.AddComponent<VerticalLayoutGroup>() : rail.gameObject.AddComponent<HorizontalLayoutGroup>();
            rl.padding = wide ? new RectOffset(6, 6, 8, 8) : new RectOffset(2, 2, 4, 4); rl.spacing = 2;
            rl.childControlWidth = true; rl.childControlHeight = true; rl.childForceExpandWidth = !wide ? true : true; rl.childForceExpandHeight = !wide;
            // Inhalt
            var sr = K.Rect("Inhalt", shell); sr.anchorMin = Vector2.zero; sr.anchorMax = Vector2.one;
            sr.gameObject.AddComponent<Image>().color = new Color(0, 0, 0, 0);
            scroll = sr.gameObject.AddComponent<ScrollRect>(); scroll.horizontal = false; scroll.scrollSensitivity = 40; scroll.movementType = ScrollRect.MovementType.Clamped; scroll.decelerationRate = .12f;
            var vp = K.Rect("Viewport", sr); K.Fill(vp); vp.gameObject.AddComponent<RectMask2D>();
            content = K.Rect("Content", vp); content.anchorMin = new Vector2(0, 1); content.anchorMax = new Vector2(1, 1); content.pivot = new Vector2(.5f, 1); content.sizeDelta = Vector2.zero;
            var cv = content.gameObject.AddComponent<VerticalLayoutGroup>(); cv.spacing = wide ? 16 : 12;
            cv.childControlWidth = true; cv.childControlHeight = true; cv.childForceExpandWidth = true; cv.childForceExpandHeight = false;
            content.gameObject.AddComponent<ContentSizeFitter>().verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            scroll.viewport = vp; scroll.content = content;
            lastKey = "";
        }

        void Layout(bool railOn)
        {
            rail.gameObject.SetActive(railOn);
            var sr = (RectTransform)scroll.transform;
            sr.offsetMin = new Vector2(wide && railOn ? RailW : 0, !wide && railOn ? RailH : 0);
            sr.offsetMax = new Vector2(0, -BoardH);
        }

        void Go(string a) { area = a; Render(); }
        void Save() { try { if (G != null) Store.Save(G); } catch (Exception e) { Debug.LogWarning("Speichern fehlgeschlagen: " + e.Message); } }
        bool Jobless { get { return G != null && G.IsCareer && G.S.fav < 0; } }
        void Next() { if (G == null || G.SeasonDone) return; if (Jobless) G.NextDay(); else if (G.S.fav >= 0) PlayToFavMatch(); else return; Save(); Render(); }
        void SimSeason() { if (G == null) return; G.SimToEnd(); Save(); Render(); }
        void CloseSeason() { G.EndSeason(); showAllLog = false; Save(); Go("news"); }

        void Render()
        {
            try { RenderInner(); }
            catch (Exception e)
            {
                Debug.LogException(e); K.Clear(content);
                var c = K.Card(content); K.T(c, "Fehler", 24, K.Down, K.FD); K.T(c, e.Message + "\n" + e.StackTrace, 12, K.Mut);
                K.Btn(c, "Zum Start", () => Go(G != null && G.S.fav >= 0 ? "home" : "title"));
            }
        }

        void RenderInner()
        {
            K.Clear(content); resultsBox = null;
            bool inGame = G != null && (G.S.fav >= 0 || G.IsCareer); bool picking = G != null && G.S.fav < 0 && !G.IsCareer;
            if (G == null && area != "setup") area = "title";
            if (Jobless && (area == "news" || area == "hist")) area = "home";
            Layout(inGame || picking);
            BuildBoard(inGame, picking);
            if (inGame || picking) BuildRail(picking);
            if (G != null && G.Events.Count > 0) { foreach (var ev in G.Events) LogLine(content, ev, K.Gold); G.Events.Clear(); }
            switch (area)
            {
                case "title": Title(); break;
                case "setup": Setup(); break;
                case "home": if (picking) Pick(); else if (Jobless) CareerPage(); else Home(); break;
                case "news": News(); break;
                case "fav": if (Jobless && viewTeam < 0) CareerPage(); else Club(); break;
                case "de": Leagues(false); break;
                case "eu": Leagues(true); break;
                case "hist": History(); break;
                case "cups": Cups(); break;
            }
            string key = area + "|" + favSub + "|" + viewLeague + "|" + viewTeam + "|" + vbView + "|" + viewCup;
            if (key != lastKey) { lastKey = key; Canvas.ForceUpdateCanvases(); scroll.verticalNormalizedPosition = 1; }
        }

        // ================= Anzeigetafel und Bereichsleiste =================
        void BuildBoard(bool inGame, bool picking)
        {
            K.Clear(board);
            if (wide || G == null)
            {
                var brand = K.VBox(board, 0); K.LE(brand, -1, -1, 0);
                K.T(brand, "FUSSBALL-PYRAMIDE", wide ? 30 : 24, K.Ink, K.FD, TextAnchor.MiddleLeft, -1, false);
                if (G != null) K.Click(brand, () => { Save(); G = null; Go("title"); });
                if (G == null) K.T(brand, "DIE KOMPLETTE DEUTSCHE FUSSBALLPYRAMIDE", 10.5f, K.Mut, K.F, TextAnchor.MiddleLeft, -1, false);
                if (G != null) { var sep = K.Rect("Trenner", board); sep.gameObject.AddComponent<Image>().color = K.BoardLine; K.LE(sep, 1, 36); }
            }
            if (G != null)
            {
                var clock = K.VBox(board, 0); K.Flex(clock);
                string head = G.SeasonDone ? "Saison " + Sl(G.S.season) + " beendet" : "Spieltag " + G.S.day + " von " + G.MaxDay;
                K.T(clock, head, wide ? 18 : 16, K.Ink, K.FM, TextAnchor.MiddleLeft, -1, false);
                K.T(clock, picking ? "Wähle deinen Verein" : Jobless ? "Ohne Verein · " + G.C.offers.Count + " Angebote" : NextInfo(), 11, K.Mut, K.F, TextAnchor.MiddleLeft, -1, false);
            }
            else K.Spacer(board);
            if (!inGame) return;
            if (G.SeasonDone) { var b = K.Btn(board, wide ? "Saison abschließen" : "Abschließen", CloseSeason, K.B.Primary, 32, -1, 13.5f, "ff"); return; }
            K.Btn(board, wide ? "Weiter" : "", Next, K.B.Primary, 32, wide ? -1 : 40, 13.5f, "play");
            K.Btn(board, wide ? "Saison" : "", SimSeason, K.B.Board, 32, wide ? -1 : 40, 13.5f, "ff");
        }

        string NextInfo()
        {
            if (G.S.fav < 0) return "";
            string n = NextText(); return n == "–" ? "Keine Spiele mehr in dieser Saison" : "Nächstes Spiel: " + n;
        }

        void BuildRail(bool picking)
        {
            for (int i = rail.childCount - 1; i >= 0; i--) { var c = rail.GetChild(i); if (c.name != "Linie") { c.SetParent(null, false); Destroy(c.gameObject); } }
            foreach (var a in Areas)
            {
                if ((picking || Jobless) && (a[0] == "news" || a[0] == "hist")) continue;
                if (picking && a[0] == "fav") continue;
                string key = a[0]; bool on = area == key;
                var r = K.VBox(rail, 3, 0, null, "Bereich"); var v = r.GetComponent<VerticalLayoutGroup>(); v.childAlignment = TextAnchor.MiddleCenter; v.padding = new RectOffset(2, 2, wide ? 8 : 5, wide ? 8 : 5);
                v.childControlWidth = false; v.childForceExpandWidth = false;
                K.Shape(r, on ? K.AccSoft : new Color(0, 0, 0, 0), 8);
                Color c2 = on ? K.Acc : K.Mut;
                K.Icon(r, a[2], wide ? 22 : 20, c2);
                var t = K.T(r, picking && key == "home" ? "Verein wählen" : a[1], wide ? 10.5f : 9.5f, c2, K.FM, TextAnchor.MiddleCenter, -1, false); t.rectTransform.sizeDelta = new Vector2(wide ? 64 : 60, 14);
                var bt = K.Click(r, () => { if (key == "fav") { viewTeam = -1; favSub = "ov"; } if (key == "de" || key == "eu") { viewLeague = null; viewRound = -1; } Go(key); });
                if (!on) { var img = r.GetComponent<Image>(); img.sprite = K.Round(8, K.AccSoft); var cb = bt.colors; cb.normalColor = new Color(1, 1, 1, 0); cb.highlightedColor = Color.white; cb.pressedColor = Color.white; cb.selectedColor = new Color(1, 1, 1, 0); bt.colors = cb; }
                if (wide) K.LE(r, -1, 56); else K.Flex(r);
            }
        }

        // ================= Bausteine =================
        // Spalten nebeneinander (PC) bzw. untereinander (Handy)
        RectTransform[] Cols(Transform p, params float[] w)
        {
            var res = new RectTransform[w.Length];
            if (!wide) { for (int i = 0; i < w.Length; i++) res[i] = (RectTransform)p; return res; }
            var row = K.Rect("Spalten", p); var h = row.gameObject.AddComponent<HorizontalLayoutGroup>();
            h.spacing = 16; h.childAlignment = TextAnchor.UpperLeft; h.childControlWidth = true; h.childControlHeight = true; h.childForceExpandWidth = false; h.childForceExpandHeight = false;
            for (int i = 0; i < w.Length; i++) { var c = K.VBox(row, 16); K.Flex(c, w[i]); res[i] = c; }
            return res;
        }
        // Raster gleich breiter Zellen
        List<RectTransform> Grid(Transform p, int n, int perRow)
        {
            var cells = new List<RectTransform>(); if (!wide) perRow = 1;
            for (int i = 0; i < n; i += perRow)
            {
                var row = K.Rect("Raster", p); var h = row.gameObject.AddComponent<HorizontalLayoutGroup>();
                h.spacing = 12; h.childAlignment = TextAnchor.UpperLeft; h.childControlWidth = true; h.childControlHeight = true; h.childForceExpandWidth = false; h.childForceExpandHeight = true;
                for (int j = 0; j < perRow; j++) { var c = K.VBox(row, 0); K.Flex(c); if (i + j < n) cells.Add(c); }
            }
            return cells;
        }
        // Chips/Knöpfe mit Zeilenumbruch
        void Flow(Transform p, List<KeyValuePair<string, Action>> items, string active, float h = 28)
        {
            float maxW = contentW - 4, x = 0; RectTransform row = null;
            foreach (var it in items)
            {
                float w = it.Key.Length * 7.2f + 26;
                if (row == null || x + w > maxW) { row = K.HBox(p, h, 6); x = 0; }
                var a = it.Value; K.Btn(row, it.Key, () => a(), it.Key == active ? K.B.ChipOn : K.B.Chip, h, -1, 12.5f);
                x += w + 6;
            }
        }
        void Tag(Transform p, string s, bool accent = false)
        {
            var r = K.HBox(p, 20, 0, 6); K.Shape(r, new Color(0, 0, 0, 0), 4, accent ? K.Acc : K.Line);
            K.T(r, s.ToUpperInvariant(), 10.5f, accent ? K.Acc : K.Mut, K.F, TextAnchor.MiddleCenter, -1, false).GetComponent<LayoutElement>().flexibleWidth = 0;
        }
        void PageHead(Transform p, string small, string title, params string[] tags)
        {
            var c = K.Card(p, 14, 2);
            var r = K.HBox(c, -1, 10); r.GetComponent<HorizontalLayoutGroup>().childAlignment = TextAnchor.LowerLeft;
            var v = K.VBox(r, 0); K.Flex(v);
            if (!string.IsNullOrEmpty(small)) K.T(v, small, 12.5f, K.Mut);
            K.T(v, title, wide ? 30 : 26, K.Ink, K.FD);
            foreach (var t in tags) Tag(r, t, t.StartsWith("!"));
        }
        // Mein-Verein-Leiste mit goldener Kante
        void FavStrip(Transform p)
        {
            if (G == null || G.S.fav < 0) return;
            var t = G.T(G.S.fav); var l = G.LeagueOf(G.S.fav);
            var r = K.HBox(p, wide ? 48 : 64, 14); K.Shape(r, K.Panel, 8, K.Line);
            var hg = r.GetComponent<HorizontalLayoutGroup>(); hg.padding = new RectOffset(0, 14, 0, 0);
            var bar = K.Rect("Kante", r); K.Shape(bar, K.Gold, 2); K.LE(bar, 4, wide ? 48 : 64);
            var ic = K.Icon(r, "starf", 14, K.Gold); ic.GetComponent<LayoutElement>().minHeight = 14;
            var v = K.VBox(r, 0); K.LE(v, wide ? 190 : -1, -1, wide ? 0 : 1).minWidth = 0; v.GetComponent<VerticalLayoutGroup>().childAlignment = TextAnchor.MiddleLeft;
            K.T(v, t.name, 13.5f, K.Ink, K.FM, TextAnchor.MiddleLeft, -1, false);
            if (l != null) K.T(v, l.name.ToUpperInvariant(), 10.5f, K.Mut, K.F, TextAnchor.MiddleLeft, -1, false);
            var fx = G.FixturesOf(G.S.fav);
            var last = fx.Where(x => x.Value.hg >= 0).LastOrDefault(); var nx = fx.FirstOrDefault(x => x.Value.hg < 0);
            if (wide)
            {
                StripCol(r, "ZULETZT", last.Value == null ? "–" : ResultText(last.Value, G.S.fav), last.Value == null ? K.Ink : ResultColor(last.Value, G.S.fav));
                StripCol(r, "ALS NÄCHSTES", NextText(), K.Ink);
                if (G.IsCareer) StripCol(r, "VORSTAND", Mathf.RoundToInt(G.C.conf) + "/100 · " + Game.ConfLabel(G.C.conf), G.C.conf >= 55 ? K.Up : G.C.conf >= 38 ? K.Rel : K.Down);
                K.Spacer(r);
            }
            K.Click(r, () => { viewTeam = -1; favSub = "ov"; Go("fav"); });
        }
        void StripCol(Transform p, string label, string val, Color c)
        {
            var v = K.VBox(p, 0); K.LE(v, -1, -1, 0); v.GetComponent<VerticalLayoutGroup>().childAlignment = TextAnchor.MiddleLeft;
            K.T(v, label, 10.5f, K.Mut, K.F, TextAnchor.MiddleLeft, -1, false);
            K.T(v, val, 13.5f, c, K.FM, TextAnchor.MiddleLeft, -1, false);
        }
        // nächstes Liga- oder Pokalspiel (was zuerst kommt)
        string NextText()
        {
            int fav = G.S.fav; var l = G.LeagueOf(fav);
            var nx = G.FixturesOf(fav).FirstOrDefault(x => x.Value.hg < 0);
            int ld = nx.Value != null && l != null && nx.Key < l.dates.Count ? l.dates[nx.Key] : int.MaxValue;
            Cup c; int rd; var cm = G.NextCupMatch(fav, out c, out rd);
            int cd = cm != null ? c.dates[rd] : int.MaxValue;
            if (cm != null && cd < ld) { bool h = cm.h == fav; return G.T(h ? cm.a : cm.h).name + (h ? " (H)" : " (A)") + " · " + c.name; }
            if (nx.Value == null) return "–";
            var m = nx.Value; bool home = m.h == fav;
            return G.T(home ? m.a : m.h).name + (home ? " (H)" : " (A)");
        }
        string ResultText(Match m, int id) { var o = G.T(m.h == id ? m.a : m.h).name; int me = m.h == id ? m.hg : m.ag, op = m.h == id ? m.ag : m.hg; return me + ":" + op + " gegen " + o; }
        Color ResultColor(Match m, int id) { int me = m.h == id ? m.hg : m.ag, op = m.h == id ? m.ag : m.hg; return me > op ? K.Up : me < op ? K.Down : K.Rel; }

        static string Sl(int s) { return s + "/" + ((s + 1) % 100).ToString("00"); }

        // Spielzeile (.m): Heim rechtsbündig, Ergebnisfeld, Gast linksbündig
        void MatchRow(Transform p, Match m, int focus = -1, string sub = null)
        {
            var r = K.HBox(p, 31, 8); var hg = r.GetComponent<HorizontalLayoutGroup>(); hg.childAlignment = TextAnchor.MiddleCenter;
            var h = G.T(m.h); var a = G.T(m.a); bool played = m.hg >= 0;
            bool hw = played && m.hg > m.ag, aw = played && m.ag > m.hg;
            var hn = K.Cell(r, h.name, -1, TextAnchor.MiddleRight, m.h == G.S.fav ? K.Acc : K.Ink, hw ? K.FM : K.F);
            K.Crest(r, h, 16);
            var s = K.HBox(r, 24, 0); K.Shape(s, K.Bg, 4); K.LE(s, 64, 24, 0); s.GetComponent<HorizontalLayoutGroup>().childAlignment = TextAnchor.MiddleCenter;
            Color sc = K.Ink; if (played && focus >= 0 && (m.h == focus || m.a == focus)) sc = ResultColor(m, focus);
            K.T(s, played ? m.hg + ":" + m.ag : "–:–", 18, played ? sc : K.Mut, K.FD, TextAnchor.MiddleCenter, -1, false);
            K.Crest(r, a, 16);
            K.Cell(r, a.name, -1, TextAnchor.MiddleLeft, m.a == G.S.fav ? K.Acc : K.Ink, aw ? K.FM : K.F);
            K.Divider(p);
        }

        // Tabelle mit Zonenfarben
        Color ZoneColor(League l, int i, int n)
        {
            if (l.id == "bl") return i < 4 ? CL : i < 6 ? EL : i == 6 ? ECL : i == 15 ? K.Rel : i >= 16 ? K.Down : Color.clear;
            if (l.foreign) return i < 4 ? CL : i < 6 ? EL : i == 6 ? ECL : i >= n - 3 ? K.Down : Color.clear;
            int z = G.Zone(l, i, n); return z == 1 ? K.Up : z == 2 || z == -2 ? K.Rel : z == -1 ? K.Down : Color.clear;
        }
        void TableView(Transform p, League l, int from = 0, int to = int.MaxValue, bool compact = false)
        {
            var tb = G.Table(l); to = Math.Min(to, tb.Count);
            bool full = wide && !compact;
            var h = K.HBox(p, 26, 0);
            Hd(h, "PL.", 40, TextAnchor.MiddleLeft); Hd(h, "", 22, TextAnchor.MiddleLeft); Hd(h, "VEREIN", -1, TextAnchor.MiddleLeft);
            Hd(h, "SP", 34); if (full) { Hd(h, "S", 34); Hd(h, "U", 34); Hd(h, "N", 34); Hd(h, "TORE", 58); }
            Hd(h, "DIFF", 46); Hd(h, "PKT", 40);
            K.Divider(p);
            for (int i = from; i < to; i++)
            {
                var row = tb[i]; var t = G.T(row.id); bool me = row.id == G.S.fav;
                var r = K.HBox(p, 28, 0); if (me) r.gameObject.AddComponent<Image>().color = K.AccSoft;
                var zc = ZoneColor(l, i, tb.Count);
                var bar = K.Rect("Zone", r); bar.gameObject.AddComponent<Image>().color = zc; K.LE(bar, 4, 28);
                K.Cell(r, (i + 1).ToString(), 36, TextAnchor.MiddleCenter, K.Ink, K.FM);
                K.Crest(r, t, 16); K.Gap(r, 0); K.LE(K.Rect("x", r), 6, 1);
                K.Cell(r, t.name, -1, TextAnchor.MiddleLeft, K.Ink, me ? K.FM : K.F);
                Num(r, row.sp.ToString(), 34);
                if (full) { Num(r, row.s.ToString(), 34); Num(r, row.u.ToString(), 34); Num(r, row.n.ToString(), 34); Num(r, row.tf + ":" + row.tg, 58); }
                Num(r, row.Diff.ToString(), 46); Num(r, row.p.ToString(), 40, true);
                int id = row.id; K.Click(r, () => OpenTeam(id));
                K.Divider(p);
            }
        }
        void Hd(Transform p, string s, float w, TextAnchor a = TextAnchor.MiddleRight) { K.Cell(p, s, w, a, K.Mut, K.FM, 10.5f); }
        void Num(Transform p, string s, float w, bool bold = false) { K.Cell(p, s, w, TextAnchor.MiddleRight, K.Ink, bold ? K.FM : K.F); }
        void Legend(Transform p, League l)
        {
            var r = K.HBox(p, 22, 14);
            var items = new List<KeyValuePair<Color, string>>();
            if (l.id == "bl" || l.foreign) { items.Add(new KeyValuePair<Color, string>(CL, "Champions League")); items.Add(new KeyValuePair<Color, string>(EL, "Europa League")); items.Add(new KeyValuePair<Color, string>(ECL, "Conference League")); }
            else items.Add(new KeyValuePair<Color, string>(K.Up, "Aufstieg"));
            if (!l.foreign) items.Add(new KeyValuePair<Color, string>(K.Rel, "Relegation"));
            items.Add(new KeyValuePair<Color, string>(K.Down, "Abstieg"));
            foreach (var it in items)
            {
                var b = K.Rect("Farbe", r); K.Shape(b, it.Key, 2); K.LE(b, 10, 10);
                K.T(r, it.Value, 12, K.Mut, K.F, TextAnchor.MiddleLeft, -1, false).GetComponent<LayoutElement>().flexibleWidth = 0;
            }
        }

        void OpenTeam(int id) { viewTeam = id == G.S.fav ? -1 : id; favSub = "ov"; Go("fav"); }
        void OpenLeague(string id) { var l = G.L(id); viewLeague = id; viewRound = -1; Go(l != null && l.foreign ? "eu" : "de"); }

        // ================= Startbildschirm =================
        void Title()
        {
            var outer = K.HBox(content, -1, 0); outer.GetComponent<HorizontalLayoutGroup>().childAlignment = TextAnchor.UpperCenter;
            K.Spacer(outer);
            var col = K.VBox(outer, 14); K.LE(col, Mathf.Min(560, contentW), -1, 0);
            K.Spacer(outer);
            if (wide) K.Gap(col, 90);
            var c = K.Card(col, 28, 12);
            K.T(c, "FUSSBALL-PYRAMIDE", wide ? 56 : 40, K.Ink, K.FD, TextAnchor.MiddleCenter);
            K.T(c, "Von der Kreisklasse bis zur Bundesliga – jede Liga, jeder Verein.", 14, K.Mut, K.F, TextAnchor.MiddleCenter);
            K.Gap(c, 6);
            if (error != null) K.T(c, error, 12.5f, K.Down);
            for (int sl = 1; sl <= Store.Slots; sl++) SlotRow(c, sl);
            var info = K.Card(col, 14, 4);
            try { var w = Store.LoadWorld(); K.T(info, w.teams.Count.ToString("N0").Replace(',', '.') + " Vereine · " + w.leagues.Count + " Ligen · " + Crests() + " Wappen", 13.5f, K.Ink, K.FM, TextAnchor.MiddleCenter); }
            catch (Exception e) { K.T(info, "Daten fehlen: " + e.Message, 13, K.Down); }
            K.T(info, "Unity-Fassung · Ligabetrieb mit Auf- und Abstieg in der ganzen Pyramide", 12, K.Mut, K.F, TextAnchor.MiddleCenter);
        }
        static int crestCount = -1;
        static int Crests() { if (crestCount < 0) crestCount = Resources.LoadAll<Texture2D>("Crests").Length; return crestCount; }

        int confirmDel = -1;
        void SlotRow(Transform p, int sl)
        {
            var m = Store.Meta(sl);
            var r = K.HBox(p, 58, 10); K.Shape(r, K.Bg, 6, K.Line); K.Pad(r, 12, 10, 0, 0);
            var v = K.VBox(r, 0); K.Flex(v);
            K.T(v, "SPIELSTAND " + sl, 10.5f, K.Mut, K.F, TextAnchor.MiddleLeft, -1, false);
            if (m == null) K.T(v, "Frei", 14, K.Mut, K.FM, TextAnchor.MiddleLeft, -1, false);
            else
            {
                K.T(v, m.club + (string.IsNullOrEmpty(m.league) ? "" : " · " + m.league), 14, K.Ink, K.FM, TextAnchor.MiddleLeft, -1, false);
                K.T(v, (m.mode == "career" ? "Karriere" + (string.IsNullOrEmpty(m.coach) ? "" : " · " + m.coach) : "Freies Spiel") + (m.season > 0 ? " · Saison " + Sl(m.season) : "") + (string.IsNullOrEmpty(m.saved) ? "" : " · " + m.saved), 11, K.Mut, K.F, TextAnchor.MiddleLeft, -1, false);
            }
            int s2 = sl;
            if (m != null)
            {
                K.Btn(r, "Laden", () => ContinueGame(s2), K.B.Primary, 32, -1, 13.5f, "play");
                K.Btn(r, confirmDel == sl ? "Wirklich löschen?" : "Löschen", () => { if (confirmDel != s2) { confirmDel = s2; Render(); return; } Store.Delete(s2); confirmDel = -1; Render(); }, K.B.Outline, 32, -1, 12.5f);
            }
            else K.Btn(r, "Neues Spiel", () => { Store.Slot = s2; NewGame(); }, K.B.Outline, 32, -1, 13.5f);
        }
        void ContinueGame(int sl)
        {
            try { G = Game.FromState(Store.Load(sl), Store.LoadNames()); error = null; viewTeam = -1; viewLeague = null; viewCup = null; Go("home"); }
            catch (Exception e) { error = "Spielstand konnte nicht geladen werden: " + e.Message; Debug.LogException(e); Render(); }
        }
        void NewGame() { G = null; Go("setup"); }
        void StartGame()
        {
            G = Game.NewGame(Store.LoadWorld(), Store.LoadNames(), Environment.TickCount & 0x7fffffff); query = "";
            if (newMode == "career" && careerStart != "club") { G.NewCareer(coachName, -1, careerStart); Save(); }
            Go("home");
        }
        void TakeClub(int id)
        {
            if (newMode == "career") G.NewCareer(coachName, id, "club"); else G.NewFree(id);
            viewTeam = -1; viewLeague = null; Save(); Go("home");
        }

        // ================= Spielmodus wählen =================
        void Setup()
        {
            PageHead(content, "Neues Spiel", "Spielmodus");
            var cols = Cols(content, 1, 1);
            ModeCard(cols[0], "free", "FREIES SPIEL", "Übernimm einen beliebigen Verein – ohne Vorstand, ohne Entlassung. Spiele so viele Saisons, wie du willst.");
            ModeCard(cols[1], "career", "KARRIERE", "Du bist Trainer: Der Vorstand setzt ein Saisonziel, misst dich am Vertrauen und kann dich entlassen. Ruf, Lizenzen, Jobangebote und Bewerbungen.");
            if (newMode == "career")
            {
                var c = K.Card(content, 16, 10);
                K.T(c, "DEIN TRAINER", 20, K.Ink, K.FD);
                SearchField(c, "Name des Trainers", coachName, v => coachName = v, false);
                K.T(c, "KARRIERESTART", 18, K.Ink, K.FD);
                var cells = Grid(c, 3, 3);
                StartCard(cells[0], "club", "Wunschverein", "Du wählst deinen Verein. Lizenz und Ruf passen zur Liga.");
                StartCard(cells[1], "zero", "Von ganz unten", "Ohne Lizenz, ohne Ruf, 3.000 € auf dem Konto. Erste Angebote kommen aus den Kreisligen.");
                StartCard(cells[2], "pro", "Erfahrener Trainer", "B-Lizenz, etwas Ruf und 250.000 € Erspartes. Du suchst dir eine Stelle.");
            }
            var bh = K.HBox(content, 40, 10);
            K.Btn(bh, "Zurück", () => Go("title"), K.B.Outline, 40, -1, 14);
            K.Spacer(bh);
            K.Btn(bh, newMode == "career" && careerStart != "club" ? "Karriere starten" : "Weiter zur Vereinswahl", StartGame, K.B.Primary, 40, -1, 15, "play");
        }
        void ModeCard(Transform p, string key, string title, string text)
        {
            bool on = newMode == key;
            var c = K.VBox(p, 6, 16); K.Shape(c, on ? K.AccSoft : K.Panel, 8, on ? K.Acc : K.Line);
            K.T(c, title, 24, on ? K.Acc : K.Ink, K.FD); K.T(c, text, 13.5f, K.Mut);
            K.Click(c, () => { newMode = key; Render(); });
        }
        void StartCard(Transform p, string key, string title, string text)
        {
            bool on = careerStart == key;
            var c = K.VBox(p, 4, 12); K.Shape(c, on ? K.AccSoft : K.Bg, 6, on ? K.Acc : K.Line); K.Flex(c);
            K.T(c, title, 15, on ? K.Acc : K.Ink, K.FM); K.T(c, text, 12.5f, K.Mut);
            K.Click(c, () => { careerStart = key; Render(); });
        }

        // ================= Karriere =================
        void CareerPage()
        {
            var c = G.C;
            PageHead(content, "Karriere · " + c.name, Jobless ? "Ohne Verein" : "Trainerkarriere", "Ruf " + Mathf.RoundToInt(c.rep), Game.Lics[c.lic].n);
            CareerTiles(content);
            var cols = Cols(content, 1.2f, 1);
            if (c.offers.Count > 0 || Jobless)
            {
                var oc = K.Card(cols[0], 14, 0); K.T(oc, "ANGEBOTE", 20, K.Ink, K.FD); K.Gap(oc, 6);
                if (c.offers.Count == 0) K.T(oc, "Noch keine Angebote – sie kommen im Lauf der Saison. Du kannst dich auch selbst bewerben.", 12.5f, K.Mut);
                for (int i = 0; i < c.offers.Count; i++) { int ix = i; JobRow(oc, c.offers[i].club, () => { G.AcceptOffer(ix); Save(); Go("home"); }, "Annehmen"); }
            }
            if (Jobless)
            {
                var vc = K.Card(cols[0], 14, 0); K.T(vc, "FREIE STELLEN", 20, K.Ink, K.FD);
                K.T(vc, "Bewerben kannst du dich auch bei jedem anderen Verein – öffne ihn über „Ligen“.", 12, K.Mut); K.Gap(vc, 6);
                foreach (var id in G.Vacancies()) { int vid = id; string why; if (G.CanApply(id, out why)) JobRow(vc, id, () => Apply(vid), "Bewerben · " + Mathf.RoundToInt((float)G.ApplyChance(id) * 100) + " %"); else JobRow(vc, id, null, why); }
            }
            LicenseCard(cols[1]);
            CareerHistory(cols[1]);
        }
        void CareerTiles(Transform p)
        {
            var c = G.C; var tiles = new List<string[]>();
            if (!Jobless)
            {
                tiles.Add(new[] { "Vorstand", Mathf.RoundToInt(c.conf) + "/100", Game.ConfLabel(c.conf) });
                if (c.hasGoal) { var lg = G.L(c.goal.lg); var tb = lg != null ? G.Standing(lg) : new List<int>(); tiles.Add(new[] { "Saisonziel", c.goal.label, "Platz " + c.goal.pos + " · aktuell " + (tb.IndexOf(c.club) + 1) + "." }); }
                tiles.Add(new[] { "Bilanz", c.stats.w + "-" + c.stats.d + "-" + c.stats.l, c.stats.g + " Spiele" });
            }
            tiles.Add(new[] { "Ruf", Mathf.RoundToInt(c.rep).ToString(), Game.RepLabel(c.rep) });
            tiles.Add(new[] { "Lizenz", Game.Lics[c.lic].k == "0" ? "keine" : Game.Lics[c.lic].k, Game.LicRange(c.lic) });
            tiles.Add(new[] { "Konto", Util.Money(c.money), "" });
            var cells = wide ? Grid(p, tiles.Count, 6) : GridForce(p, tiles.Count, 2);
            for (int i = 0; i < tiles.Count; i++)
            {
                var tl = K.VBox(cells[i], 2, 10); K.Shape(tl, K.Panel, 6, K.Line); K.Flex(tl);
                K.T(tl, tiles[i][0].ToUpperInvariant(), 10.5f, K.Mut, K.F, TextAnchor.MiddleLeft, -1, false);
                Color vc = i == 0 && !Jobless ? (c.conf >= 55 ? K.Up : c.conf >= 38 ? K.Rel : K.Down) : K.Ink;
                K.T(tl, tiles[i][1], 17, vc, K.FM, TextAnchor.MiddleLeft);
                if (tiles[i][2] != "") K.T(tl, tiles[i][2], 11, K.Mut, K.F, TextAnchor.MiddleLeft);
            }
        }
        void JobRow(Transform p, int id, Action act, string label)
        {
            var t = G.T(id); var l = G.LeagueOf(id);
            var r = K.HBox(p, 46, 10); K.Crest(r, t, 26);
            var v = K.VBox(r, 0); K.Flex(v);
            K.Cell(v, t.name, -1, TextAnchor.MiddleLeft, K.Ink, K.FM);
            K.Cell(v, l != null ? l.name + " · Stufe " + l.level : "", -1, TextAnchor.MiddleLeft, K.Mut, K.F, 12);
            if (act != null) K.Btn(r, label, () => act(), K.B.Primary, 28, -1, 12.5f); else if (!string.IsNullOrEmpty(label)) Tag(r, label);
            K.Btn(r, "", () => OpenTeam(id), K.B.Outline, 28, 28, 12, "right");
            K.Divider(p);
        }
        void Apply(int id)
        {
            string r = G.ApplyJob(id);
            G.Events.Add(r == "ok" ? "Zusage! " + G.T(id).name + " holt dich als Trainer." : r == "nein" ? G.T(id).name + " hat deine Bewerbung abgelehnt." : r == "lizenz" ? "Für diese Liga fehlt dir die Lizenz." : "Du hast dich dort in dieser Saison schon beworben.");
            Save(); if (r == "ok") { viewTeam = -1; Go("home"); } else Render();
        }
        void LicenseCard(Transform p)
        {
            var c = G.C; var lc = K.Card(p, 14, 6); K.T(lc, "TRAINERLIZENZ", 20, K.Ink, K.FD);
            K.T(lc, Game.Lics[c.lic].n + " – erlaubt " + Game.LicRange(c.lic) + ".", 13.5f, K.Ink);
            if (c.course >= 0) K.T(lc, "Lehrgang zur " + Game.Lics[c.course].n + " läuft – noch " + Mathf.CeilToInt(c.courseLeft) + " Spieltage.", 12.5f, K.Acc);
            else if (c.lic + 1 < Game.Lics.Length)
            {
                var nx = Game.Lics[c.lic + 1];
                K.T(lc, "Nächste Stufe: " + nx.n + " · " + Util.Money(nx.cost) + " · " + nx.dur + " Spieltage" + (nx.rep > 0 ? " · ab Ruf " + nx.rep : "") + (nx.seasons > 0 ? " · " + nx.seasons + " Saison(s) Erfahrung" : ""), 12.5f, K.Mut);
                K.Btn(lc, "Lehrgang starten", () => { string r = G.StartCourse(); G.Events.Add(r == "ok" ? "Lehrgang zur " + nx.n + " gestartet." : r); Save(); Render(); }, K.B.Outline, 30, -1, 13);
            }
        }
        void CareerHistory(Transform p)
        {
            var c = G.C; var hc = K.Card(p, 14, 0); K.T(hc, "KARRIEREVERLAUF", 20, K.Ink, K.FD); K.Gap(hc, 6);
            if (c.club >= 0) HistRow(hc, Sl(c.since) + "–", G.T(c.club).name, c.stats.w + "-" + c.stats.d + "-" + c.stats.l, "LÄUFT", K.Mut);
            foreach (var h in c.hist) HistRow(hc, Sl(h.from), h.name + (string.IsNullOrEmpty(h.titles) ? "" : "\n" + h.titles), h.w + "-" + h.d + "-" + h.l + " · " + h.end, "", K.Mut);
            if (c.club < 0 && c.hist.Count == 0) K.T(hc, "Noch keine Station.", 12.5f, K.Mut);
        }

        // ================= Verein wählen =================
        void Pick()
        {
            PageHead(content, "Neues Spiel · Saison " + Sl(G.S.season), "Verein wählen");
            var cols = Cols(content, 1, 1.35f);
            var c = K.Card(cols[0], 16, 10);
            K.T(c, "SUCHE", 20, K.Ink, K.FD);
            K.T(c, "Name oder Ort eingeben – oder unter „Ligen“ durch die Pyramide stöbern.", 12.5f, K.Mut);
            SearchField(c, "Verein suchen …", query, v => { query = v; FillResults(); });
            K.Stretch(K.Btn(c, "Ligen durchsuchen", () => Go("de"), K.B.Outline, 32, -1, 13.5f, "ligen"));
            resultsBox = K.Card(cols[1], 12, 0);
            FillResults();
        }
        void FillResults()
        {
            if (resultsBox == null) return; K.Clear(resultsBox);
            IEnumerable<Team> list; string q = (query ?? "").Trim().ToLowerInvariant();
            if (q.Length < 2) { list = G.L("bl").teams.Select(id => G.T(id)); K.T(resultsBox, "BUNDESLIGA", 20, K.Ink, K.FD); }
            else { list = G.S.teams.Where(t => G.LeagueOf(t.id) != null && !G.LeagueOf(t.id).foreign && t.name.ToLowerInvariant().Contains(q)).OrderBy(t => G.LeagueOf(t.id).level).Take(50); K.T(resultsBox, "TREFFER", 20, K.Ink, K.FD); }
            int n = 0;
            foreach (var t in list)
            {
                var l = G.LeagueOf(t.id);
                var r = K.HBox(resultsBox, 44, 10);
                K.Crest(r, t, 26);
                var v = K.VBox(r, 0); K.Flex(v);
                K.Cell(v, t.name, -1, TextAnchor.MiddleLeft, K.Ink, K.FM);
                K.Cell(v, l != null ? l.name + " · Stufe " + l.level : "", -1, TextAnchor.MiddleLeft, K.Mut, K.F, 12);
                K.Cell(r, t.r.ToString("0.0"), 50, TextAnchor.MiddleRight, K.Mut);
                int id = t.id; K.Click(r, () => OpenTeam(id));
                K.Divider(resultsBox); n++;
            }
            if (n == 0) K.T(resultsBox, "Kein Verein gefunden.", 13.5f, K.Mut);
        }
        void SearchField(Transform p, string placeholder, string value, Action<string> changed, bool focus = true)
        {
            var r = K.Rect("Eingabe", p); var img = K.Shape(r, K.Bg, 6, K.Line); K.LE(r, -1, 34);
            var tr = K.T(r, "", 13.5f, K.Ink, K.F, TextAnchor.MiddleLeft, -1, false); tr.supportRichText = false; K.Fill(tr.rectTransform); tr.rectTransform.offsetMin = new Vector2(10, 0); tr.rectTransform.offsetMax = new Vector2(-10, 0);
            var ph = K.T(r, placeholder, 13.5f, K.Mut, K.F, TextAnchor.MiddleLeft, -1, false); K.Fill(ph.rectTransform); ph.rectTransform.offsetMin = new Vector2(10, 0); ph.rectTransform.offsetMax = new Vector2(-10, 0);
            var inp = r.gameObject.AddComponent<InputField>(); inp.textComponent = tr; inp.placeholder = ph; inp.targetGraphic = img; inp.text = value ?? ""; inp.caretColor = K.Acc; inp.selectionColor = new Color(.24f, .7f, .48f, .35f);
            inp.onValueChanged.AddListener(v => changed(v));
            if (wide && focus) inp.ActivateInputField();
        }

        // ================= Start =================
        void Home()
        {
            FavStrip(content);
            PageHead(content, "Saison " + Sl(G.S.season), "Übersicht", G.SeasonDone ? "Saison beendet" : "Spieltag " + G.S.day + "/" + G.MaxDay);
            var fl = G.LeagueOf(G.S.fav);
            K.Section(content, "Deutschland");
            var de = new List<League> { G.L("bl"), G.L("bl2"), G.L("l3") }.Where(x => x != null).ToList();
            if (fl != null && !de.Contains(fl)) de.Add(fl);
            var cells = Grid(content, de.Count, 4);
            for (int i = 0; i < de.Count; i++) MiniLeague(cells[i], de[i]);
            K.Section(content, "Top-Ligen Europas");
            var eu = G.S.leagues.Where(x => x.foreign).Take(4).ToList();
            cells = Grid(content, eu.Count, 4);
            for (int i = 0; i < eu.Count; i++) MiniLeague(cells[i], eu[i]);
            K.Section(content, "Wettbewerbe");
            var cl = new List<Cup>(); var dfb = G.CupById("dfb"); if (dfb != null) cl.Add(dfb);
            cl.AddRange(G.CupsOf(G.S.fav).Where(x => x.type != "dfb"));
            cells = Grid(content, cl.Count, 4);
            for (int i = 0; i < cl.Count; i++)
            {
                var c = cl[i]; var tl = K.VBox(cells[i], 2, 12); K.Shape(tl, K.Panel, 8, K.Line);
                K.T(tl, c.name.ToUpperInvariant(), 10.5f, K.Mut, K.F, TextAnchor.MiddleLeft, -1, false);
                string st = c.winner >= 0 ? "Sieger: " + G.T(c.winner).name : (c.played == 0 ? Game.RoundName(c.R, 0) + " ausstehend" : Game.RoundName(c.R, c.played) + " · " + c.played + "/" + c.R);
                K.T(tl, st, 14, K.Ink, K.FM, TextAnchor.MiddleLeft);
                string me = G.CupReach(c, G.S.fav); if (me != null) K.T(tl, "Dein Verein: " + me, 12, me == "Sieger" ? K.Gold : K.Acc, K.F);
                var cid = c.id; K.Click(tl, () => { viewCup = cid; Go("cups"); });
            }
        }
        void MiniLeague(Transform cell, League l)
        {
            var c = K.Card(cell, 12, 0); K.Flex(c);
            var h = K.HBox(c, 34, 6);
            var tt = K.T(h, l.name, 19, K.Ink, K.FM, TextAnchor.MiddleLeft, -1, false); K.Flex(tt);
            K.T(h, l.played + "/" + l.rounds.Count, 12.5f, K.Mut, K.F, TextAnchor.MiddleRight, -1, false).GetComponent<LayoutElement>().flexibleWidth = 0;
            var tb = G.Table(l); int fi = tb.FindIndex(r => r.id == G.S.fav);
            var idx = new List<int> { 0, 1, 2, 3 }; if (fi > 3) { idx[3] = fi; }
            foreach (int i in idx)
            {
                if (i >= tb.Count) break;
                K.Divider(c);
                var r = K.HBox(c, 27, 8); var t = G.T(tb[i].id); bool me = tb[i].id == G.S.fav;
                K.Cell(r, (i + 1).ToString(), 16, TextAnchor.MiddleLeft, K.Mut);
                K.Crest(r, t, 16);
                K.Cell(r, t.name, -1, TextAnchor.MiddleLeft, me ? K.Acc : K.Ink, me ? K.FM : K.F);
                K.Cell(r, tb[i].p.ToString(), 30, TextAnchor.MiddleRight, K.Ink, K.FM);
            }
            var lid = l.id; K.Click(c, () => OpenLeague(lid));
        }

        // ================= News =================
        void News()
        {
            FavStrip(content);
            PageHead(content, "Saison " + Sl(G.S.season), "News");
            var cols = Cols(content, 1.35f, 1);
            var c = K.Card(cols[0], 16, 8);
            int fav = G.S.fav; string fn = G.T(fav).name;
            if (G.S.log.Count > 0)
            {
                var lg = G.S.log[0];
                K.T(c, "SAISON " + Sl(lg.season) + " · RÜCKBLICK", 20, K.Ink, K.FD);
                foreach (var x in lg.lines.Where(x => x.Contains(fn))) LogLine(c, x, K.Gold);
                int cap = 40;
                var lines = showAllLog ? lg.lines.Where(x => !x.Contains(fn)).Take(500).ToList() : lg.lines.Where(x => !x.Contains(fn)).Take(cap).ToList();
                foreach (var x in lines) LogLine(c, x, K.Acc);
                if (!showAllLog && lg.lines.Count > cap) K.Btn(c, "Alle " + lg.lines.Count + " Meldungen", () => { showAllLog = true; Render(); });
            }
            else
            {
                K.T(c, "AKTUELL", 20, K.Ink, K.FD);
                LogLine(c, "Saison " + Sl(G.S.season) + " läuft – " + (G.SeasonDone ? "alle Spiele gespielt." : "Spieltag " + G.S.day + " von " + G.MaxDay + "."), K.Acc);
                LogLine(c, "Nach der Saison stehen hier Meister, Auf- und Absteiger und alle Relegationsspiele.", K.Acc);
            }
            var r = K.Card(cols[1], 16, 0);
            K.T(r, "LETZTE ERGEBNISSE", 20, K.Ink, K.FD); K.Gap(r, 6);
            var done = G.FixturesOf(fav).Where(x => x.Value.hg >= 0).Reverse().Take(8).ToList();
            if (done.Count == 0) K.T(r, "Noch keine Spiele", 13.5f, K.Mut);
            foreach (var x in done) MatchRow(r, x.Value, fav);
        }
        void LogLine(Transform p, string s, Color edge)
        {
            var r = K.HBox(p, -1, 0); K.Shape(r, K.Bg, 4); var hg = r.GetComponent<HorizontalLayoutGroup>(); hg.childForceExpandHeight = true; hg.padding = new RectOffset(0, 10, 0, 0);
            var bar = K.Rect("Kante", r); bar.gameObject.AddComponent<Image>().color = edge; K.LE(bar, 3, -1);
            var v = K.VBox(r, 0); K.Flex(v); v.GetComponent<VerticalLayoutGroup>().padding = new RectOffset(10, 0, 6, 6);
            K.T(v, s, 13.5f, K.Ink);
        }

        // ================= Verein =================
        void Club()
        {
            int id = viewTeam >= 0 ? viewTeam : G.S.fav; if (id < 0) { Go("home"); return; }
            var t = G.T(id); var l = G.LeagueOf(id); bool mine = id == G.S.fav;
            var subs = new List<KeyValuePair<string, Action>> {
                new KeyValuePair<string, Action>("Überblick", () => { favSub = "ov"; Render(); }), new KeyValuePair<string, Action>("Kader", () => { favSub = "squad"; Render(); }),
                new KeyValuePair<string, Action>("Spiele", () => { favSub = "games"; Render(); }), new KeyValuePair<string, Action>("Historie", () => { favSub = "hist"; Render(); }) };
            if (mine) subs.Insert(2, new KeyValuePair<string, Action>("Finanzen", () => { favSub = "fin"; Render(); }));
            if (mine && G.IsCareer) subs.Add(new KeyValuePair<string, Action>("Karriere", () => { favSub = "career"; Render(); }));
            if (!mine && (G.S.fav >= 0 || G.IsCareer)) subs.Insert(0, new KeyValuePair<string, Action>(G.S.fav >= 0 ? "◀ Mein Verein" : "◀ Karriere", () => { viewTeam = -1; favSub = "ov"; Render(); }));
            string act = favSub == "fin" ? "Finanzen" : favSub == "squad" ? "Kader" : favSub == "games" ? "Spiele" : favSub == "hist" ? "Historie" : favSub == "career" ? "Karriere" : "Überblick";
            if (favSub == "career" && mine) { Flow(content, subs, act); CareerPage(); return; }
            Flow(content, subs, act);

            // Vereinskarte mit goldener Oberkante
            var card = K.VBox(content, 0, 0, null, "Vereinskarte"); K.Shape(card, K.Panel, 8, K.Line);
            var top = K.Rect("Kante", card); K.Shape(top, K.Gold, 2); K.LE(top, -1, 3);
            var inner = K.VBox(card, 10, 14);
            K.T(inner, (mine ? "Mein Verein" : "Verein") + (l != null ? " · " + l.name : ""), 12.5f, K.Mut);
            var hr = K.HBox(inner, 44, 12); K.Crest(hr, t, 40);
            K.T(hr, (mine ? "★ " : "") + t.name, wide ? 26 : 21, K.Ink, K.FM, TextAnchor.MiddleLeft, -1, false);
            if (favSub == "ov")
            {
                var sq = G.Squad(id); var ps = sq.Select(x => G.S.players[x]).ToList();
                var tiles = new List<string[]>();
                var fx = G.FixturesOf(id);
                string form = string.Join(" ", fx.Where(x => x.Value.hg >= 0).Reverse().Take(5).Reverse().Select(x => { var m = x.Value; int me = m.h == id ? m.hg : m.ag, op = m.h == id ? m.ag : m.hg; return me > op ? "S" : me < op ? "N" : "U"; }).ToArray());
                tiles.Add(new[] { "Form", form.Length > 0 ? form : "–", "" });
                tiles.Add(new[] { "Stimmung", t.mo >= 80 ? "Euphorisch" : t.mo >= 65 ? "Gut" : t.mo >= 45 ? "Normal" : t.mo >= 30 ? "Gedrückt" : "Schlecht", t.mo + "/100" });
                if (l != null) { var tb = G.Table(l); int pos = tb.FindIndex(r => r.id == id); tiles.Add(new[] { "Tabellenplatz", (pos + 1) + ". · " + tb[pos].p + " Pkt", "" }); }
                tiles.Add(new[] { "Spielstärke", t.r.ToString("0.0", System.Globalization.CultureInfo.InvariantCulture), "" });
                tiles.Add(new[] { "Kaderwert", Util.Money(ps.Sum(x => (double)G.PlayerValue(x))), "" });
                if (mine) { var fz = G.FZ(id); tiles.Add(new[] { "Kontostand", Util.Money(fz.c), fz.d > 0 ? "Kredite " + Util.Money(fz.d) : "schuldenfrei" }); }
                tiles.Add(new[] { "Ø Alter", ps.Count > 0 ? ps.Average(x => x.a).ToString("0.0") : "–", ps.Count + " Spieler" });
                var cells = wide ? Grid(inner, tiles.Count, 6) : GridForce(inner, tiles.Count, 2);
                for (int i = 0; i < tiles.Count; i++)
                {
                    var tl = K.VBox(cells[i], 2, 10); K.Shape(tl, K.Bg, 6); K.Flex(tl);
                    K.T(tl, tiles[i][0].ToUpperInvariant(), 10.5f, K.Mut, K.F, TextAnchor.MiddleLeft, -1, false);
                    K.T(tl, tiles[i][1], 17, i == 0 ? K.Ink : K.Ink, K.FM, TextAnchor.MiddleLeft, -1, false);
                    if (tiles[i][2] != "") K.T(tl, tiles[i][2], 11, K.Mut, K.F, TextAnchor.MiddleLeft, -1, false);
                }
                if (G.S.fav < 0 && !G.IsCareer) K.Stretch(K.Btn(inner, newMode == "career" ? "Als Trainer übernehmen" : "Diesen Verein übernehmen", () => TakeClub(id), K.B.Primary, 40, -1, 15, "starf"));
                if (G.IsCareer && !mine) { string why; if (G.CanApply(id, out why)) K.Stretch(K.Btn(inner, "Bewerben · " + Mathf.RoundToInt((float)G.ApplyChance(id) * 100) + " %" + (G.Vacancies().Contains(id) ? " · Stelle frei" : ""), () => Apply(id), K.B.Primary, 36, -1, 14)); else if (!string.IsNullOrEmpty(why)) Tag(inner, why); }

                var cols = Cols(content, 1.35f, 1);
                if (l != null)
                {
                    var tc = K.Card(cols[0], 14, 0); K.T(tc, "TABELLE " + l.name.ToUpperInvariant(), 20, K.Ink, K.FD); K.Gap(tc, 8);
                    var tb = G.Table(l); int pos = tb.FindIndex(r => r.id == id);
                    int a = Mathf.Clamp(pos - 3, 0, Mathf.Max(0, tb.Count - 7));
                    TableView(tc, l, a, a + 7, true);
                    K.Gap(tc, 10); var lid = l.id; K.Btn(tc, "Ganze Tabelle", () => OpenLeague(lid));
                }
                var rc = K.Card(cols[1], 14, 4);
                K.T(rc, "FORM", 20, K.Ink, K.FD);
                var last = fx.Where(x => x.Value.hg >= 0).Reverse().Take(5).ToList();
                if (last.Count == 0) K.T(rc, "Noch keine Spiele", 12.5f, K.Mut);
                else { var fr = K.HBox(rc, 26, 4); foreach (var x in last.AsEnumerable().Reverse()) { var m = x.Value; int me = m.h == id ? m.hg : m.ag, op = m.h == id ? m.ag : m.hg; var b = K.HBox(fr, 26, 0); K.Shape(b, me > op ? K.Up : me < op ? K.Down : K.Rel, 4); K.LE(b, 26, 26, 0); b.GetComponent<HorizontalLayoutGroup>().childAlignment = TextAnchor.MiddleCenter; K.T(b, me > op ? "S" : me < op ? "N" : "U", 13, K.AccInk, K.FM, TextAnchor.MiddleCenter, -1, false); } }
                K.Gap(rc, 8);
                K.T(rc, "NÄCHSTE SPIELE", 20, K.Ink, K.FD);
                var nx = fx.Where(x => x.Value.hg < 0).Take(5).ToList();
                if (nx.Count == 0) K.T(rc, "Keine offenen Spiele", 12.5f, K.Mut);
                foreach (var x in nx) { K.T(rc, (x.Key + 1) + ". SPIELTAG · " + (l != null ? l.name.ToUpperInvariant() : ""), 10.5f, K.Mut); MatchRow(rc, x.Value, id); }
            }
            else if (favSub == "squad") SquadCard(id);
            else if (favSub == "fin") FinancePage(id);
            else if (favSub == "games")
            {
                var c = K.Card(content, 14, 2); K.T(c, "ALLE SPIELE", 20, K.Ink, K.FD);
                foreach (var x in G.FixturesOf(id)) { K.T(c, (x.Key + 1) + ". SPIELTAG", 10.5f, K.Mut); MatchRow(c, x.Value, id); }
            }
            else ClubHistory(content, id);
        }
        void FinancePage(int id)
        {
            var z = G.FZ(id); var b = G.Balance(id); int lv = G.FinLv(id);
            var tiles = new List<string[]> {
                new[] { "Kontostand", Util.Money(z.c), "verfügbar" },
                new[] { "Kredite", z.d > 0 ? Util.Money(z.d) : "keine", z.d > 0 ? "Zins " + (z.ir * 100).ToString("0.0") + " %" : "" },
                new[] { "Prognose Saison", (b.res >= 0 ? "+" : "") + Util.Money(b.res), "bei aktuellem Tabellenplatz" },
                new[] { "Stadion", z.cap.ToString("N0").Replace(',', '.') + " Plätze", "Ø " + b.att.ToString("N0").Replace(',', '.') + " Zuschauer · " + b.price + " €" },
                new[] { "Gehälter", Util.Money(b.exp[0].Value), "pro Saison" } };
            var cells = wide ? Grid(content, tiles.Count, 5) : GridForce(content, tiles.Count, 2);
            for (int i = 0; i < tiles.Count; i++)
            {
                var tl = K.VBox(cells[i], 2, 10); K.Shape(tl, K.Panel, 6, K.Line); K.Flex(tl);
                K.T(tl, tiles[i][0].ToUpperInvariant(), 10.5f, K.Mut, K.F, TextAnchor.MiddleLeft, -1, false);
                K.T(tl, tiles[i][1], 17, i == 2 ? (b.res >= 0 ? K.Up : K.Down) : K.Ink, K.FM, TextAnchor.MiddleLeft);
                if (tiles[i][2] != "") K.T(tl, tiles[i][2], 11, K.Mut, K.F, TextAnchor.MiddleLeft);
            }
            var cols = Cols(content, 1, 1);
            FinTable(cols[0], "EINNAHMEN", b.inc, b.rev, K.Up);
            FinTable(cols[0], "AUSGABEN", b.exp, b.ex, K.Down);
            var sc = K.Card(cols[1], 14, 6); K.T(sc, "STADION", 20, K.Ink, K.FD);
            K.T(sc, z.cap.ToString("N0").Replace(',', '.') + " Plätze · Unterhalt " + Util.Money(Game.StadUpkeep(lv, z.cap)) + " pro Saison", 13.5f, K.Ink);
            K.T(sc, "Ausbau um " + G.StadStep(id) + " Plätze für " + Util.Money(G.StadCost(id)) + ". Mehr Plätze bringen mehr Zuschauereinnahmen, kosten aber Unterhalt.", 12.5f, K.Mut);
            K.Btn(sc, "Stadion ausbauen", () => { string r = G.StadiumUpgrade(id); G.Events.Add(r == "ok" ? "Das Stadion wurde auf " + G.FZ(id).cap + " Plätze ausgebaut." : r); Save(); Render(); }, K.B.Outline, 30, -1, 13);
            var kc = K.Card(cols[1], 14, 6); K.T(kc, "KREDITE", 20, K.Ink, K.FD);
            double lim = G.CreditLimit(id);
            K.T(kc, "Kreditrahmen: " + Util.Money(lim) + " · Zins 6 %", 13.5f, K.Ink);
            var kh = K.HBox(kc, 30, 8);
            double step = Math.Max(1000, Math.Round(lim / 4 / 1000) * 1000);
            if (lim >= 1000) K.Btn(kh, "Kredit " + Util.Money(Math.Min(lim, step)), () => { double got = G.TakeLoan(id, step); G.Events.Add("Kredit über " + Util.Money(got) + " aufgenommen."); Save(); Render(); }, K.B.Outline, 30, -1, 13);
            if (z.d > 0 && z.c > 0) K.Btn(kh, "Tilgen " + Util.Money(Math.Min(z.d, z.c)), () => { double p2 = G.Repay(id, z.d); G.Events.Add(Util.Money(p2) + " Kredit getilgt."); Save(); Render(); }, K.B.Outline, 30, -1, 13);
            var hc = K.Card(cols[1], 14, 0); K.T(hc, "BILANZEN", 20, K.Ink, K.FD); K.Gap(hc, 6);
            if (z.h.Count == 0) K.T(hc, "Noch keine abgeschlossene Saison.", 12.5f, K.Mut);
            foreach (var h in z.h)
            {
                var r = K.HBox(hc, 28, 8);
                K.Cell(r, Sl(h.season), 76, TextAnchor.MiddleLeft, K.Ink, K.FM);
                K.Cell(r, "Umsatz " + Util.Money(h.rev), -1, TextAnchor.MiddleLeft, K.Mut);
                K.Cell(r, (h.res >= 0 ? "+" : "") + Util.Money(h.res), 110, TextAnchor.MiddleRight, h.res >= 0 ? K.Up : K.Down, K.FM);
                K.Divider(hc);
            }
        }
        void FinTable(Transform p, string title, List<KeyValuePair<string, double>> rows, double sum, Color c)
        {
            var card = K.Card(p, 14, 0); K.T(card, title, 20, K.Ink, K.FD); K.Gap(card, 6);
            foreach (var r in rows.Where(x => x.Value >= 1))
            {
                var h = K.HBox(card, 28, 8);
                K.Cell(h, r.Key, -1, TextAnchor.MiddleLeft, K.Ink);
                K.Cell(h, Util.Money(r.Value), 130, TextAnchor.MiddleRight, K.Ink);
                K.Divider(card);
            }
            var t = K.HBox(card, 30, 8); K.Cell(t, "Summe (Saison)", -1, TextAnchor.MiddleLeft, K.Ink, K.FM); K.Cell(t, Util.Money(sum), 130, TextAnchor.MiddleRight, c, K.FM);
        }
        List<RectTransform> GridForce(Transform p, int n, int perRow)
        {
            var cells = new List<RectTransform>();
            for (int i = 0; i < n; i += perRow)
            {
                var row = K.Rect("Raster", p); var h = row.gameObject.AddComponent<HorizontalLayoutGroup>();
                h.spacing = 8; h.childControlWidth = true; h.childControlHeight = true; h.childForceExpandWidth = false; h.childForceExpandHeight = true;
                for (int j = 0; j < perRow; j++) { var c = K.VBox(row, 0); K.Flex(c); if (i + j < n) cells.Add(c); }
            }
            return cells;
        }

        void SquadCard(int id)
        {
            var t = G.T(id); var ps = G.Squad(id).Select(x => G.S.players[x]).ToList();
            var c = K.Card(content, 14, 0);
            K.T(c, "KADER", 20, K.Ink, K.FD); K.Gap(c, 8);
            var h = K.HBox(c, 26, 0);
            Hd(h, "NR", 36, TextAnchor.MiddleCenter); Hd(h, "NAME", -1, TextAnchor.MiddleLeft); Hd(h, "POS", 44, TextAnchor.MiddleCenter);
            if (wide) Hd(h, "NAT.", 52, TextAnchor.MiddleCenter);
            Hd(h, "ALTER", 50); Hd(h, "STÄRKE", 60); Hd(h, "MARKTWERT", wide ? 110 : 84);
            K.Divider(c);
            foreach (var pos in Game.Pos)
                foreach (var p in ps.Where(x => x.p == pos).OrderByDescending(x => x.s))
                {
                    var r = K.HBox(c, 28, 0);
                    K.Cell(r, p.no > 0 ? p.no.ToString() : "", 36, TextAnchor.MiddleCenter, K.Mut);
                    K.Cell(r, p.n, -1, TextAnchor.MiddleLeft, K.Ink, K.F);
                    K.Cell(r, pos, 44, TextAnchor.MiddleCenter, K.Mut, K.FM, 12);
                    if (wide) K.Cell(r, Short(p.nat), 52, TextAnchor.MiddleCenter, K.Mut, K.F, 12);
                    Num(r, p.a.ToString(), 50);
                    K.Cell(r, p.s.ToString("0"), 60, TextAnchor.MiddleRight, p.s >= t.r + 4 ? K.Up : p.s <= t.r - 6 ? K.Mut : K.Ink, K.FM);
                    K.Cell(r, Util.Money(G.PlayerValue(p)), wide ? 110 : 84, TextAnchor.MiddleRight, K.Mut, K.F, 12.5f);
                    K.Divider(c);
                }
        }
        static string Short(string nat) { if (string.IsNullOrEmpty(nat)) return ""; if (nat.StartsWith("X:")) return nat.Substring(2, Math.Min(3, nat.Length - 2)).ToUpperInvariant(); return nat == "DE" ? "GER" : nat; }

        void ClubHistory(Transform p, int id)
        {
            var c = K.Card(p, 14, 0); K.T(c, "SAISONVERLAUF", 20, K.Ink, K.FD); K.Gap(c, 6);
            var h = G.S.hist.FirstOrDefault(x => x.team == id);
            var l = G.LeagueOf(id);
            if (l != null)
            {
                var tb = G.Table(l); int pos = tb.FindIndex(r => r.id == id);
                HistRow(c, Sl(G.S.season), l.name, (pos + 1) + ". · " + tb[pos].p + " Pkt", "LÄUFT", K.Mut);
            }
            if (h != null) foreach (var e in h.e)
                {
                    var nl = h.e.IndexOf(e) > 0 ? h.e[h.e.IndexOf(e) - 1] : null;
                    int nextLv = nl != null ? nl.level : (l != null ? l.level : e.level);
                    string mv = nextLv < e.level ? "▲ Aufstieg" : nextLv > e.level ? "▼ Abstieg" : "";
                    HistRow(c, Sl(e.season), e.league + (string.IsNullOrEmpty(e.cups) ? "" : "\n" + e.cups), e.pos + "." + (e.pos == 1 ? " ★" : "") + " · " + e.pts + " Pkt", mv, mv.StartsWith("▲") ? K.Up : K.Down);
                }
            if (h == null && id != G.S.fav) K.T(c, "Vereinsgeschichte wird nur für deinen Verein geführt.", 12.5f, K.Mut);
        }
        void HistRow(Transform p, string season, string league, string res, string mv, Color mvc)
        {
            var r = K.HBox(p, -1, 12); K.Pad(r, 0, 0, 7, 7);
            K.Cell(r, season, 76, TextAnchor.MiddleLeft, K.Ink, K.FM, 15);
            var v = K.VBox(r, 0); K.Flex(v);
            K.Cell(v, res, -1, TextAnchor.MiddleLeft, K.Ink, K.FM, 14);
            K.T(v, league, 12.5f, K.Mut, K.F);
            if (mv != "") { if (mv == "LÄUFT") Tag(r, mv); else K.Cell(r, mv, 100, TextAnchor.MiddleRight, mvc, K.FM); }
            K.Divider(p);
        }

        // ================= Ligen / Europa =================
        void Leagues(bool foreign)
        {
            var items = new List<KeyValuePair<string, Action>>();
            if (!foreign)
            {
                foreach (var id in Game.ProLeagues) { var lid = id; if (G.L(id) != null) items.Add(new KeyValuePair<string, Action>(ShortName[id], () => { vbOpen = false; OpenLeague(lid); })); }
                var fl = G.S.fav >= 0 ? G.LeagueOf(G.S.fav) : null;
                if (fl != null && !Game.ProLeagues.Contains(fl.id)) { var fid = fl.id; items.Add(new KeyValuePair<string, Action>("★ " + fl.name, () => { vbOpen = false; OpenLeague(fid); })); }
                items.Add(new KeyValuePair<string, Action>(vbOpen ? "Verbände ▴" : "Verbände ▾", () => { vbOpen = !vbOpen; Render(); }));
            }
            else foreach (var l in G.S.leagues.Where(x => x.foreign)) { var lid = l.id; items.Add(new KeyValuePair<string, Action>(l.name, () => OpenLeague(lid))); }
            var cur = G.L(viewLeague);
            if (cur == null || cur.foreign != foreign) cur = foreign ? G.S.leagues.FirstOrDefault(x => x.foreign) : (G.S.fav >= 0 && !G.LeagueOf(G.S.fav).foreign ? G.LeagueOf(G.S.fav) : G.L("bl"));
            if (cur == null) return;
            if (viewLeague != cur.id) { viewLeague = cur.id; viewRound = -1; }
            string active = foreign ? cur.name : (ShortName.ContainsKey(cur.id) ? ShortName[cur.id] : (G.S.fav >= 0 && G.LeagueOf(G.S.fav) == cur ? "★ " + cur.name : ""));
            if (vbOpen && !foreign) active = vbOpen ? "Verbände ▴" : active;
            Flow(content, items, active);
            if (vbOpen && !foreign) VerbandPicker();
            FavStrip(content);

            // Ligakopf
            var c = K.Card(content, 14, 10);
            var hr = K.HBox(c, -1, 10); hr.GetComponent<HorizontalLayoutGroup>().childAlignment = TextAnchor.LowerLeft;
            var hv = K.VBox(hr, 0); K.Flex(hv);
            string vb; string bc = cur.foreign ? cur.title + " · Saison " + Sl(G.S.season) : "Stufe " + cur.level + (cur.vb != "" && VB.TryGetValue(cur.vb, out vb) ? " · " + vb : "") + (cur.kreis != "" ? " · Kreis " + cur.kreis : "") + " · Saison " + Sl(G.S.season);
            K.T(hv, bc, 12.5f, K.Mut);
            K.T(hv, cur.name, wide ? 30 : 24, K.Ink, K.FD);
            Tag(hr, cur.teams.Count + " Vereine"); Tag(hr, cur.played + "/" + cur.rounds.Count + " Spieltage");
            if (!cur.foreign) LeagueLinks(c, cur);

            var cols = Cols(c, 1.35f, 1);
            var left = K.VBox(cols[0], 0); var right = K.VBox(cols[1], 0);
            TableView(left, cur);
            K.Gap(left, 8); Legend(left, cur);
            if (!wide) K.Gap(right, 16);
            Matchday(right, cur);
        }

        void VerbandPicker()
        {
            var c = K.Card(content, 14, 8);
            var items = new List<KeyValuePair<string, Action>>();
            foreach (var kv in VB.OrderBy(x => x.Value))
            {
                string code = kv.Key; if (!G.S.leagues.Any(l => !l.foreign && l.level >= 5 && (l.vb == code || l.vbs.Contains(code)))) continue;
                items.Add(new KeyValuePair<string, Action>(kv.Value, () => { vbView = code; Render(); }));
            }
            string vn; VB.TryGetValue(vbView ?? "", out vn);
            K.T(c, "LANDESVERBÄNDE", 18, K.Ink, K.FD);
            Flow(c, items, vn);
            if (vbView == null) return;
            foreach (var g in G.S.leagues.Where(l => !l.foreign && l.level >= 5 && (l.vb == vbView || l.vbs.Contains(vbView))).GroupBy(l => l.level).OrderBy(x => x.Key))
            {
                K.T(c, "STUFE " + g.Key, 11, K.Mut, K.FM);
                var li = new List<KeyValuePair<string, Action>>();
                foreach (var l in g.OrderBy(x => x.name)) { var lid = l.id; li.Add(new KeyValuePair<string, Action>(l.name, () => { vbOpen = false; OpenLeague(lid); })); }
                Flow(c, li, G.L(viewLeague) != null ? G.L(viewLeague).name : null, 26);
            }
        }

        void LeagueLinks(Transform p, League l)
        {
            League up = null;
            if (l.level == 2) up = G.L("bl"); else if (l.level == 3) up = G.L("bl2"); else if (l.level == 4) up = G.L("l3");
            else if (l.level == 5) up = G.L(G.RegionOf(l.vb));
            else if (l.level > 5) up = G.LeagueByName(l.up) ?? G.S.leagues.FirstOrDefault(u => !u.foreign && u.level == l.level - 1 && u.vbs.Contains(l.vb));
            List<League> subs;
            if (l.level == 1) subs = new List<League> { G.L("bl2") };
            else if (l.level == 2) subs = new List<League> { G.L("l3") };
            else if (l.level == 3) subs = Game.RegionalLeagues.Select(x => G.L(x)).ToList();
            else if (l.level == 4) subs = G.S.leagues.Where(x => !x.foreign && x.level == 5 && G.RegionOf(x.vb) == l.id).ToList();
            else subs = G.S.leagues.Where(x => !x.foreign && x.level == l.level + 1 && x.up == l.name).ToList();
            subs = subs.Where(x => x != null).ToList();
            var items = new List<KeyValuePair<string, Action>>();
            if (up != null) { var uid = up.id; items.Add(new KeyValuePair<string, Action>("▲ " + up.name, () => OpenLeague(uid))); }
            foreach (var s in subs) { var sid = s.id; items.Add(new KeyValuePair<string, Action>("▼ " + s.name, () => OpenLeague(sid))); }
            if (items.Count > 0) Flow(p, items, null, 26);
        }

        void Matchday(Transform p, League l)
        {
            if (l.rounds.Count == 0) return;
            if (viewRound < 0) viewRound = Mathf.Clamp(l.played > 0 && (l.played >= l.rounds.Count || G.S.fav < 0 || G.LeagueOf(G.S.fav) != l) ? l.played - 1 : l.played, 0, l.rounds.Count - 1);
            viewRound = Mathf.Clamp(viewRound, 0, l.rounds.Count - 1);
            var nav = K.HBox(p, 34, 8); nav.GetComponent<HorizontalLayoutGroup>().childAlignment = TextAnchor.MiddleLeft;
            K.Btn(nav, "", () => { viewRound = Mathf.Max(0, viewRound - 1); Render(); }, K.B.Outline, 32, 32, 13, "left");
            K.T(nav, (viewRound + 1) + ". Spieltag", 20, K.Ink, K.FM, TextAnchor.MiddleCenter, 120, false);
            K.Btn(nav, "", () => { viewRound = Mathf.Min(l.rounds.Count - 1, viewRound + 1); Render(); }, K.B.Outline, 32, 32, 13, "right");
            K.Gap(p, 4);
            foreach (var m in l.rounds[viewRound].m) MatchRow(p, m, G.S.fav);
            int sf = l.teams.Count % 2 == 1 ? l.teams.FirstOr(id => !l.rounds[viewRound].m.Any(m => m.h == id || m.a == id), -1) : -1;
            if (sf >= 0) K.T(p, "Spielfrei: " + G.T(sf).name, 12, K.Mut);
        }

        // ================= Pokale =================
        void Cups()
        {
            int fav = G.S.fav;
            var mine = G.CupsOf(fav);
            var cur = G.CupById(viewCup) ?? mine.FirstOrDefault() ?? G.CupById("dfb");
            if (cur == null) { PageHead(content, "", "Pokale"); return; }
            viewCup = cur.id;
            var items = new List<KeyValuePair<string, Action>>();
            var dfb = G.CupById("dfb"); if (dfb != null) items.Add(new KeyValuePair<string, Action>(dfb.name, () => { lpOpen = false; viewCup = "dfb"; Render(); }));
            foreach (var c in mine.Where(x => x.type != "dfb")) { var cid = c.id; items.Add(new KeyValuePair<string, Action>(c.name, () => { lpOpen = false; viewCup = cid; Render(); })); }
            items.Add(new KeyValuePair<string, Action>(lpOpen ? "Alle Landespokale ▴" : "Alle Landespokale ▾", () => { lpOpen = !lpOpen; Render(); }));
            Flow(content, items, lpOpen ? "Alle Landespokale ▴" : cur.name);
            if (lpOpen)
            {
                var c = K.Card(content, 14, 8); K.T(c, "LANDESPOKALE", 18, K.Ink, K.FD);
                var li = new List<KeyValuePair<string, Action>>();
                foreach (var lp in G.S.cups.Where(x => x.type == "lp").OrderBy(x => x.name)) { var cid = lp.id; li.Add(new KeyValuePair<string, Action>(lp.name, () => { lpOpen = false; viewCup = cid; Render(); })); }
                Flow(c, li, cur.name, 26);
            }
            FavStrip(content);

            var head = K.Card(content, 14, 10);
            var hr = K.HBox(head, -1, 10); hr.GetComponent<HorizontalLayoutGroup>().childAlignment = TextAnchor.LowerLeft;
            var hv = K.VBox(hr, 0); K.Flex(hv);
            string vb; string kind = cur.type == "dfb" ? "Pokal · Deutschland" : cur.type == "lp" ? "Landespokal · " + (VB.TryGetValue(cur.vb, out vb) ? vb : cur.vb) : "Kreispokal · " + (VB.TryGetValue(cur.vb, out vb) ? vb : cur.vb);
            K.T(hv, kind + " · Saison " + Sl(G.S.season), 12.5f, K.Mut);
            K.T(hv, cur.name, wide ? 30 : 24, K.Ink, K.FD);
            Tag(hr, cur.teams.Count + " Teams"); Tag(hr, cur.winner >= 0 ? "Entschieden" : "Runde " + Math.Min(cur.R, cur.played + 1) + "/" + cur.R);
            string me = G.CupReach(cur, fav);
            if (me != null) K.T(head, "Dein Verein: " + me, 13.5f, me == "Sieger" ? K.Gold : K.Acc, K.FM);
            if (cur.winner >= 0)
            {
                var ch = K.HBox(head, 56, 12); K.Shape(ch, K.AccSoft, 6); K.Pad(ch, 14, 14, 0, 0);
                K.Icon(ch, "pokal", 26, K.Gold); K.Crest(ch, G.T(cur.winner), 30);
                K.T(ch, "Pokalsieger: " + G.T(cur.winner).name, 22, K.Ink, K.FD, TextAnchor.MiddleLeft, -1, false);
            }

            // Runden, die neueste zuerst
            var shown = Enumerable.Range(0, cur.rounds.Count).Reverse().ToList();
            var cells = Grid(content, shown.Count, 2);
            for (int i = 0; i < shown.Count; i++)
            {
                int k = shown[i]; var rd = cur.rounds[k];
                var c = K.Card(cells[i], 14, 0); K.Flex(c);
                var h = K.HBox(c, 30, 8);
                var tt = K.T(h, Game.RoundName(cur.R, k).ToUpperInvariant(), 20, K.Ink, K.FD, TextAnchor.MiddleLeft, -1, false); K.Flex(tt);
                K.T(h, k < cur.played ? "gespielt" : "Spieltag " + (k < cur.dates.Count ? cur.dates[k] : 0), 12, K.Mut, K.F, TextAnchor.MiddleRight, -1, false).GetComponent<LayoutElement>().flexibleWidth = 0;
                K.Gap(c, 4);
                var list = rd.m.OrderByDescending(m => m.h == fav || m.a == fav).ThenBy(m => m.bye).ToList();
                int max = 40, n = 0;
                foreach (var m in list) { if (n++ >= max) { K.T(c, "… und " + (list.Count - max) + " weitere Spiele", 12, K.Mut); break; } CupRow(c, m, fav); }
            }
        }
        void CupRow(Transform p, CupMatch m, int focus)
        {
            var r = K.HBox(p, 31, 8); r.GetComponent<HorizontalLayoutGroup>().childAlignment = TextAnchor.MiddleCenter;
            var h = G.T(m.h); bool done = m.w >= 0 && !m.bye;
            K.Cell(r, h.name, -1, TextAnchor.MiddleRight, m.h == G.S.fav ? K.Acc : K.Ink, m.w == m.h && !m.bye ? K.FM : K.F);
            K.Crest(r, h, 16);
            var s = K.HBox(r, 24, 0); K.Shape(s, K.Bg, 4); K.LE(s, 64, 24, 0); s.GetComponent<HorizontalLayoutGroup>().childAlignment = TextAnchor.MiddleCenter;
            Color sc = K.Ink;
            if (done && (m.h == focus || m.a == focus)) sc = m.w == focus ? K.Up : K.Down;
            string txt = m.bye ? "Freilos" : done ? m.hg + ":" + m.ag : "–:–";
            K.T(s, txt, m.bye ? 12 : 18, done ? sc : K.Mut, m.bye ? K.F : K.FD, TextAnchor.MiddleCenter, -1, false);
            if (m.a >= 0)
            {
                var a = G.T(m.a);
                K.Crest(r, a, 16);
                K.Cell(r, a.name + (m.ph >= 0 ? "  (" + m.ph + ":" + m.pa + " i.E.)" : m.et ? "  (n.V.)" : ""), -1, TextAnchor.MiddleLeft, m.a == G.S.fav ? K.Acc : K.Ink, m.w == m.a ? K.FM : K.F);
            }
            else { K.LE(K.Rect("leer", r), 16, 16); K.Cell(r, "", -1); }
            K.Divider(p);
        }

        // ================= Historie =================
        void History()
        {
            FavStrip(content);
            PageHead(content, "Saison " + Sl(G.S.season), "Historie");
            var cols = Cols(content, 1, 1);
            ClubHistory(cols[0], G.S.fav);
            var c = K.Card(cols[1], 14, 0); K.T(c, "DEUTSCHE MEISTER", 20, K.Ink, K.FD); K.Gap(c, 6);
            if (G.S.log.Count == 0) K.T(c, "Noch keine Saison abgeschlossen.", 12.5f, K.Mut);
            foreach (var lg in G.S.log)
            {
                var line = lg.lines.FirstOrDefault(x => x.StartsWith("Deutscher Meister: ")); if (line == null) continue;
                string name = line.Substring("Deutscher Meister: ".Length); var t = G.S.teams.FirstOrDefault(x => x.name == name);
                var r = K.HBox(c, 32, 10);
                K.Cell(r, Sl(lg.season), 76, TextAnchor.MiddleLeft, K.Mut, K.FM);
                if (t != null) K.Crest(r, t, 18);
                K.Cell(r, name, -1, TextAnchor.MiddleLeft, K.Ink, K.FM);
                K.Divider(c);
            }
        }

        // spielt Spieltage, bis Mein Verein gespielt hat (kleine Ligen spielen nicht an jedem Spieltag)
        void PlayToFavMatch()
        {
            var l = G.LeagueOf(G.S.fav); int before = l != null ? l.played : 0; int g = 0;
            while (!G.SeasonDone && l != null && l.played == before && g++ < 100) G.NextDay();
        }
    }
}
