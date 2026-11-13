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
        string favSub = "ov"; int viewTeam = -1; string viewLeague; int viewRound = -1; string vbView; bool vbOpen; string query = "";
        bool showAllLog, confirmNew; string error;
        Vector2 lastScreen; Rect lastSafe;

        const float BoardH = 52, RailW = 76, RailH = 58;
        static readonly Color CL = K.Hex("#6f9be8"), EL = K.Hex("#f0954a"), ECL = K.Hex("#4cc3b8");
        static readonly Dictionary<string, string> VB = new Dictionary<string, string> {
            {"BY","Bayern"},{"BA","Baden"},{"SB","Südbaden"},{"WU","Württemberg"},{"HE","Hessen"},{"SW","Südwest"},{"RL","Rheinland"},{"SL","Saarland"},
            {"MR","Mittelrhein"},{"NR","Niederrhein"},{"WF","Westfalen"},{"NI","Niedersachsen"},{"HB","Bremen"},{"HH","Hamburg"},{"SH","Schleswig-Holstein"},
            {"MV","Mecklenburg-Vorpommern"},{"BB","Brandenburg"},{"BE","Berlin"},{"ST","Sachsen-Anhalt"},{"SN","Sachsen"},{"TH","Thüringen"} };
        static readonly string[][] Areas = { new[] { "home", "Start", "home" }, new[] { "news", "News", "news" }, new[] { "fav", "Verein", "star" }, new[] { "de", "Ligen", "ligen" }, new[] { "eu", "Europa", "europa" }, new[] { "hist", "Historie", "hist" } };
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
            if (G == null || G.S.fav < 0) return;
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
        void Save() { try { if (G != null) Store.Save(G.S); } catch (Exception e) { Debug.LogWarning("Speichern fehlgeschlagen: " + e.Message); } }
        void Next() { if (G == null || G.S.fav < 0) return; if (G.SeasonDone) return; PlayToFavMatch(); Save(); Render(); }
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
            bool inGame = G != null && G.S.fav >= 0; bool picking = G != null && G.S.fav < 0;
            if (G == null) area = "title";
            Layout(inGame || picking);
            BuildBoard(inGame, picking);
            if (inGame || picking) BuildRail(picking);
            switch (area)
            {
                case "title": Title(); break;
                case "home": if (picking) Pick(); else Home(); break;
                case "news": News(); break;
                case "fav": Club(); break;
                case "de": Leagues(false); break;
                case "eu": Leagues(true); break;
                case "hist": History(); break;
            }
            string key = area + "|" + favSub + "|" + viewLeague + "|" + viewTeam + "|" + vbView;
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
                if (G == null) K.T(brand, "DIE KOMPLETTE DEUTSCHE FUSSBALLPYRAMIDE", 10.5f, K.Mut, K.F, TextAnchor.MiddleLeft, -1, false);
                if (G != null) { var sep = K.Rect("Trenner", board); sep.gameObject.AddComponent<Image>().color = K.BoardLine; K.LE(sep, 1, 36); }
            }
            if (G != null)
            {
                var clock = K.VBox(board, 0); K.Flex(clock);
                string head = G.SeasonDone ? "Saison " + Sl(G.S.season) + " beendet" : "Spieltag " + G.S.day + " von " + G.MaxDay;
                K.T(clock, head, wide ? 18 : 16, K.Ink, K.FM, TextAnchor.MiddleLeft, -1, false);
                K.T(clock, picking ? "Wähle deinen Verein" : NextInfo(), 11, K.Mut, K.F, TextAnchor.MiddleLeft, -1, false);
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
            var fx = G.FixturesOf(G.S.fav); var nx = fx.FirstOrDefault(x => x.Value.hg < 0);
            if (nx.Value == null) return "Keine Spiele mehr in dieser Saison";
            var m = nx.Value; bool home = m.h == G.S.fav;
            return "Nächstes Spiel: " + G.T(home ? m.a : m.h).name + (home ? " (H)" : " (A)");
        }

        void BuildRail(bool picking)
        {
            for (int i = rail.childCount - 1; i >= 0; i--) { var c = rail.GetChild(i); if (c.name != "Linie") { c.SetParent(null, false); Destroy(c.gameObject); } }
            foreach (var a in Areas)
            {
                if (picking && (a[0] == "news" || a[0] == "fav" || a[0] == "hist")) continue;
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
                StripCol(r, "ALS NÄCHSTES", nx.Value == null ? "–" : G.T(nx.Value.h == G.S.fav ? nx.Value.a : nx.Value.h).name + (nx.Value.h == G.S.fav ? " (H)" : " (A)"), K.Ink);
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
            var s = K.HBox(r, 24, 0); K.Shape(s, K.Bg, 4); K.LE(s, 64, 24); s.GetComponent<HorizontalLayoutGroup>().childAlignment = TextAnchor.MiddleCenter;
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
            if (Store.HasSave) K.Stretch(K.Btn(c, "Spiel fortsetzen", ContinueGame, K.B.Primary, 40, -1, 15, "play"));
            K.Stretch(K.Btn(c, confirmNew ? "Wirklich neu beginnen? Der Spielstand wird ersetzt" : "Neues Spiel", () =>
            {
                if (Store.HasSave && !confirmNew) { confirmNew = true; Render(); return; }
                confirmNew = false; NewGame();
            }, Store.HasSave ? K.B.Outline : K.B.Primary, 40, -1, 15));
            if (error != null) K.T(c, error, 12.5f, K.Down);
            var info = K.Card(col, 14, 4);
            try { var w = Store.LoadWorld(); K.T(info, w.teams.Count.ToString("N0").Replace(',', '.') + " Vereine · " + w.leagues.Count + " Ligen · " + Crests() + " Wappen", 13.5f, K.Ink, K.FM, TextAnchor.MiddleCenter); }
            catch (Exception e) { K.T(info, "Daten fehlen: " + e.Message, 13, K.Down); }
            K.T(info, "Unity-Fassung · Ligabetrieb mit Auf- und Abstieg in der ganzen Pyramide", 12, K.Mut, K.F, TextAnchor.MiddleCenter);
        }
        static int crestCount = -1;
        static int Crests() { if (crestCount < 0) crestCount = Resources.LoadAll<Texture2D>("Crests").Length; return crestCount; }

        void ContinueGame()
        {
            try { G = Game.FromState(Store.Load(), Store.LoadNames()); error = null; Go("home"); }
            catch (Exception e) { error = "Spielstand konnte nicht geladen werden: " + e.Message; Debug.LogException(e); Render(); }
        }
        void NewGame() { G = Game.NewGame(Store.LoadWorld(), Store.LoadNames(), Environment.TickCount & 0x7fffffff); query = ""; Go("home"); }

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
        void SearchField(Transform p, string placeholder, string value, Action<string> changed)
        {
            var r = K.Rect("Eingabe", p); var img = K.Shape(r, K.Bg, 6, K.Line); K.LE(r, -1, 34);
            var tr = K.T(r, "", 13.5f, K.Ink, K.F, TextAnchor.MiddleLeft, -1, false); tr.supportRichText = false; K.Fill(tr.rectTransform); tr.rectTransform.offsetMin = new Vector2(10, 0); tr.rectTransform.offsetMax = new Vector2(-10, 0);
            var ph = K.T(r, placeholder, 13.5f, K.Mut, K.F, TextAnchor.MiddleLeft, -1, false); K.Fill(ph.rectTransform); ph.rectTransform.offsetMin = new Vector2(10, 0); ph.rectTransform.offsetMax = new Vector2(-10, 0);
            var inp = r.gameObject.AddComponent<InputField>(); inp.textComponent = tr; inp.placeholder = ph; inp.targetGraphic = img; inp.text = value ?? ""; inp.caretColor = K.Acc; inp.selectionColor = new Color(.24f, .7f, .48f, .35f);
            inp.onValueChanged.AddListener(v => changed(v));
            if (wide) inp.ActivateInputField();
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
            if (!mine && G.S.fav >= 0) subs.Insert(0, new KeyValuePair<string, Action>("◀ Mein Verein", () => { viewTeam = -1; favSub = "ov"; Render(); }));
            string act = favSub == "squad" ? "Kader" : favSub == "games" ? "Spiele" : favSub == "hist" ? "Historie" : "Überblick";
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
                tiles.Add(new[] { "Ø Alter", ps.Count > 0 ? ps.Average(x => x.a).ToString("0.0") : "–", ps.Count + " Spieler" });
                var cells = wide ? Grid(inner, tiles.Count, 6) : GridForce(inner, tiles.Count, 2);
                for (int i = 0; i < tiles.Count; i++)
                {
                    var tl = K.VBox(cells[i], 2, 10); K.Shape(tl, K.Bg, 6); K.Flex(tl);
                    K.T(tl, tiles[i][0].ToUpperInvariant(), 10.5f, K.Mut, K.F, TextAnchor.MiddleLeft, -1, false);
                    K.T(tl, tiles[i][1], 17, i == 0 ? K.Ink : K.Ink, K.FM, TextAnchor.MiddleLeft, -1, false);
                    if (tiles[i][2] != "") K.T(tl, tiles[i][2], 11, K.Mut, K.F, TextAnchor.MiddleLeft, -1, false);
                }
                if (G.S.fav < 0) K.Stretch(K.Btn(inner, "Diesen Verein übernehmen", () => { G.S.fav = id; viewTeam = -1; viewLeague = null; Save(); Go("home"); }, K.B.Primary, 40, -1, 15, "starf"));

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
                else { var fr = K.HBox(rc, 26, 4); foreach (var x in last.AsEnumerable().Reverse()) { var m = x.Value; int me = m.h == id ? m.hg : m.ag, op = m.h == id ? m.ag : m.hg; var b = K.HBox(fr, 26, 0); K.Shape(b, me > op ? K.Up : me < op ? K.Down : K.Rel, 4); K.LE(b, 26, 26); b.GetComponent<HorizontalLayoutGroup>().childAlignment = TextAnchor.MiddleCenter; K.T(b, me > op ? "S" : me < op ? "N" : "U", 13, K.AccInk, K.FM, TextAnchor.MiddleCenter, -1, false); } }
                K.Gap(rc, 8);
                K.T(rc, "NÄCHSTE SPIELE", 20, K.Ink, K.FD);
                var nx = fx.Where(x => x.Value.hg < 0).Take(5).ToList();
                if (nx.Count == 0) K.T(rc, "Keine offenen Spiele", 12.5f, K.Mut);
                foreach (var x in nx) { K.T(rc, (x.Key + 1) + ". SPIELTAG · " + (l != null ? l.name.ToUpperInvariant() : ""), 10.5f, K.Mut); MatchRow(rc, x.Value, id); }
            }
            else if (favSub == "squad") SquadCard(id);
            else if (favSub == "games")
            {
                var c = K.Card(content, 14, 2); K.T(c, "ALLE SPIELE", 20, K.Ink, K.FD);
                foreach (var x in G.FixturesOf(id)) { K.T(c, (x.Key + 1) + ". SPIELTAG", 10.5f, K.Mut); MatchRow(c, x.Value, id); }
            }
            else ClubHistory(content, id);
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
                    HistRow(c, Sl(e.season), e.league, e.pos + "." + (e.pos == 1 ? " ★" : "") + " · " + e.pts + " Pkt", mv, mv.StartsWith("▲") ? K.Up : K.Down);
                }
            if (h == null && id != G.S.fav) K.T(c, "Vereinsgeschichte wird nur für deinen Verein geführt.", 12.5f, K.Mut);
        }
        void HistRow(Transform p, string season, string league, string res, string mv, Color mvc)
        {
            var r = K.HBox(p, 48, 12);
            K.Cell(r, season, 76, TextAnchor.MiddleLeft, K.Ink, K.FM, 15);
            var v = K.VBox(r, 0); K.Flex(v);
            K.Cell(v, res, -1, TextAnchor.MiddleLeft, K.Ink, K.FM, 14);
            K.Cell(v, league, -1, TextAnchor.MiddleLeft, K.Mut, K.F, 12.5f);
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
            TableView(cols[0], cur);
            K.Gap(cols[0], 6); Legend(cols[0], cur);
            Matchday(cols[1], cur);
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
