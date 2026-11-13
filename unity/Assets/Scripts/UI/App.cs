// Oberfläche: Start, Tabelle, Spielplan, Kader, Ligen, Saison.
// Zwei Gerüste: Handy (Hochformat, Navigation unten, eine Spalte) und PC (Querformat, Seitenleiste links,
// Kopfzeile mit Aktionen, Inhalte in mehreren Spalten über die volle Breite).
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
        RectTransform shell, topBar, navBar, side, content, resultsBox, topActions;
        ScrollRect scroll; CanvasScaler scaler; RectTransform canvasRT;
        Text topTitle, topSub;
        bool wide; bool shellBuilt;
        string tab = "title"; string lastTab = "";
        int viewTeam = -1; string viewLeague; int viewRound = -1; string vbView; string query = "";
        bool showAllLog; bool confirmNew; string error;
        Vector2 lastScreen; Rect lastSafe;

        const float SideW = 560, TopH = 190, NavH = 150;

        static readonly Dictionary<string, string> VB = new Dictionary<string, string> {
            {"BY","Bayern"},{"BA","Baden"},{"SB","Südbaden"},{"WU","Württemberg"},{"HE","Hessen"},{"SW","Südwest"},{"RL","Rheinland"},{"SL","Saarland"},
            {"MR","Mittelrhein"},{"NR","Niederrhein"},{"WF","Westfalen"},{"NI","Niedersachsen"},{"HB","Bremen"},{"HH","Hamburg"},{"SH","Schleswig-Holstein"},
            {"MV","Mecklenburg-Vorpommern"},{"BB","Brandenburg"},{"BE","Berlin"},{"ST","Sachsen-Anhalt"},{"SN","Sachsen"},{"TH","Thüringen"} };
        static readonly string[][] NavItems = { new[] { "home", "Übersicht" }, new[] { "table", "Tabelle" }, new[] { "games", "Spielplan" }, new[] { "squad", "Kader" }, new[] { "leagues", "Ligen" }, new[] { "season", "Saison" } };

        // ---------- Gerüst ----------
        void Start()
        {
            K.Init();
            var cgo = new GameObject("Canvas", typeof(RectTransform));
            cgo.transform.SetParent(transform, false);
            var canvas = cgo.AddComponent<Canvas>(); canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            scaler = cgo.AddComponent<CanvasScaler>(); scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize; scaler.referenceResolution = new Vector2(1080, 1920);
            cgo.AddComponent<GraphicRaycaster>();
            canvasRT = (RectTransform)cgo.transform;
            var bg = K.Rect("Hintergrund", canvasRT); K.Fill(bg); bg.gameObject.AddComponent<Image>().color = K.Bg;
            shell = K.Rect("Gerüst", canvasRT); K.Fill(shell);
            CheckScreen(true);
        }

        void Update()
        {
            CheckScreen(false);
            Keys();
        }

        void Keys()
        {
#if ENABLE_LEGACY_INPUT_MANAGER
            if (G == null || G.S.fav < 0) return;
            if (Input.GetKeyDown(KeyCode.Escape) && tab != "home") Go("home");
            if (Input.GetKeyDown(KeyCode.Space) && !(UnityEngine.EventSystems.EventSystem.current != null && UnityEngine.EventSystems.EventSystem.current.currentSelectedGameObject != null && UnityEngine.EventSystems.EventSystem.current.currentSelectedGameObject.GetComponent<InputField>() != null))
            { if (!G.SeasonDone) { PlayToFavMatch(); Save(); Render(); } }
#endif
        }

        // Hochformat: Breite zählt (Handy). Querformat: Höhe zählt, Inhalt nutzt die volle Breite (PC).
        void CheckScreen(bool force)
        {
            var scr = new Vector2(Screen.width, Screen.height);
            if (!force && scr == lastScreen && Screen.safeArea == lastSafe) return;
            lastScreen = scr; lastSafe = Screen.safeArea;
            bool w = Screen.width > Screen.height * 1.15f;
            scaler.matchWidthOrHeight = w ? 1 : 0;
            Canvas.ForceUpdateCanvases();
            float ch = canvasRT.rect.height;
            var sa = Screen.safeArea; float top = (Screen.height - sa.yMax) / Mathf.Max(1, Screen.height) * ch, bot = sa.yMin / Mathf.Max(1, Screen.height) * ch;
            shell.offsetMin = new Vector2(0, bot); shell.offsetMax = new Vector2(0, -top);
            if (w != wide || !shellBuilt) { wide = w; BuildShell(); Render(); }
        }

        void BuildShell()
        {
            shellBuilt = true;
            K.Clear(shell); side = null; navBar = null; topActions = null;
            float left = 0, bottom = 0;
            if (wide)
            {
                // Seitenleiste
                side = K.Rect("Seitenleiste", shell); side.anchorMin = new Vector2(0, 0); side.anchorMax = new Vector2(0, 1); side.pivot = new Vector2(0, .5f); side.sizeDelta = new Vector2(SideW, 0);
                side.gameObject.AddComponent<Image>().color = K.Card;
                var sv = side.gameObject.AddComponent<VerticalLayoutGroup>(); sv.padding = new RectOffset(28, 28, 36, 28); sv.spacing = 10;
                sv.childControlWidth = true; sv.childControlHeight = true; sv.childForceExpandWidth = true; sv.childForceExpandHeight = false;
                left = SideW;
            }
            else
            {
                navBar = K.Rect("Navigation", shell); navBar.anchorMin = new Vector2(0, 0); navBar.anchorMax = new Vector2(1, 0); navBar.pivot = new Vector2(.5f, 0); navBar.sizeDelta = new Vector2(0, NavH);
                navBar.gameObject.AddComponent<Image>().color = K.Card;
                var nh = navBar.gameObject.AddComponent<HorizontalLayoutGroup>(); nh.childControlWidth = true; nh.childControlHeight = true; nh.childForceExpandWidth = true; nh.childForceExpandHeight = true; nh.padding = new RectOffset(8, 8, 10, 10); nh.spacing = 8;
                bottom = NavH;
            }

            // Kopfzeile
            topBar = K.Rect("Kopf", shell); topBar.anchorMin = new Vector2(0, 1); topBar.anchorMax = new Vector2(1, 1); topBar.pivot = new Vector2(.5f, 1);
            topBar.offsetMin = new Vector2(left, -(wide ? TopH : 170)); topBar.offsetMax = new Vector2(0, 0);
            topBar.gameObject.AddComponent<Image>().color = wide ? K.Bg : K.Card;
            var th = topBar.gameObject.AddComponent<HorizontalLayoutGroup>(); th.padding = new RectOffset(wide ? 56 : 36, wide ? 56 : 36, 18, 18); th.spacing = 24; th.childAlignment = TextAnchor.MiddleLeft;
            th.childControlWidth = true; th.childControlHeight = true; th.childForceExpandWidth = false; th.childForceExpandHeight = false;
            var tv = K.VBox(topBar, 2); K.LE(tv, -1, -1, 1).minWidth = 0;
            topTitle = K.Label(tv, "FUSSBALL-PYRAMIDE", wide ? 58 : 50, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold, -1, false);
            topSub = K.Label(tv, "", K.FSs, K.Mut, TextAnchor.MiddleLeft, FontStyle.Normal, -1, false);
            if (wide) { topActions = K.HBox(topBar, 120, 18); topActions.GetComponent<HorizontalLayoutGroup>().childAlignment = TextAnchor.MiddleRight; }

            // Inhalt
            var sr = K.Rect("Inhalt", shell); sr.anchorMin = Vector2.zero; sr.anchorMax = Vector2.one;
            sr.offsetMin = new Vector2(left, bottom); sr.offsetMax = new Vector2(0, -(wide ? TopH : 170));
            sr.gameObject.AddComponent<Image>().color = new Color(0, 0, 0, 0);
            scroll = sr.gameObject.AddComponent<ScrollRect>(); scroll.horizontal = false; scroll.scrollSensitivity = wide ? 90 : 60; scroll.movementType = ScrollRect.MovementType.Clamped; scroll.decelerationRate = .12f;
            var vp = K.Rect("Viewport", sr); K.Fill(vp); vp.gameObject.AddComponent<RectMask2D>();
            content = K.Rect("Content", vp); content.anchorMin = new Vector2(0, 1); content.anchorMax = new Vector2(1, 1); content.pivot = new Vector2(.5f, 1); content.sizeDelta = Vector2.zero;
            var cv = content.gameObject.AddComponent<VerticalLayoutGroup>(); int pad = wide ? 56 : 24; cv.padding = new RectOffset(pad, pad, wide ? 8 : 24, 64); cv.spacing = wide ? 28 : 20;
            cv.childControlWidth = true; cv.childControlHeight = true; cv.childForceExpandWidth = true; cv.childForceExpandHeight = false;
            content.gameObject.AddComponent<ContentSizeFitter>().verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            scroll.viewport = vp; scroll.content = content;
            lastTab = "";
        }

        // Spalten: am PC nebeneinander (Breite nach Gewicht), am Handy alles untereinander
        RectTransform[] Cols(params float[] w)
        {
            var res = new RectTransform[w.Length];
            if (!wide) { for (int i = 0; i < w.Length; i++) res[i] = content; return res; }
            var row = K.Rect("Spalten", content); var h = row.gameObject.AddComponent<HorizontalLayoutGroup>();
            h.spacing = 28; h.childAlignment = TextAnchor.UpperLeft; h.childControlWidth = true; h.childControlHeight = true; h.childForceExpandWidth = false; h.childForceExpandHeight = false;
            for (int i = 0; i < w.Length; i++) { var c = K.VBox(row, 28); var le = K.LE(c, -1, -1, w[i]); le.minWidth = 0; le.preferredWidth = 0; res[i] = c; }
            return res;
        }

        void Go(string t) { tab = t; Render(); }
        void Save() { try { if (G != null) Store.Save(G.S); } catch (Exception e) { Debug.LogWarning("Speichern fehlgeschlagen: " + e.Message); } }

        void Render()
        {
            try { RenderInner(); }
            catch (Exception e)
            {
                Debug.LogException(e); K.Clear(content);
                var c = K.CardBox(content); K.Label(c, "Fehler", K.FSh, K.Down, TextAnchor.MiddleLeft, FontStyle.Bold); K.Label(c, e.Message + "\n" + e.StackTrace, 26, K.Mut);
                K.Btn(c, "Zum Start", () => Go(G != null && G.S.fav >= 0 ? "home" : "title"));
            }
        }

        void RenderInner()
        {
            K.Clear(content); resultsBox = null;
            bool inGame = G != null && G.S.fav >= 0;
            if (navBar != null)
            {
                navBar.gameObject.SetActive(inGame);
                scroll.GetComponent<RectTransform>().offsetMin = new Vector2(0, inGame ? NavH : 0);
                if (inGame) BuildBottomNav();
            }
            if (side != null) BuildSide(inGame);
            UpdateTop(inGame);
            switch (tab)
            {
                case "title": Title(); break;
                case "pick": Pick(); break;
                case "home": Home(); break;
                case "table": TableTab(); break;
                case "games": Games(); break;
                case "squad": SquadTab(); break;
                case "leagues": Leagues(); break;
                case "team": TeamTab(); break;
                case "season": SeasonTab(); break;
            }
            if (tab != lastTab) { lastTab = tab; Canvas.ForceUpdateCanvases(); scroll.verticalNormalizedPosition = 1; }
        }

        static readonly Dictionary<string, string> PageNames = new Dictionary<string, string> {
            {"home","Übersicht"},{"table","Tabelle"},{"games","Spielplan"},{"squad","Kader"},{"leagues","Ligen"},{"team","Verein"},{"season","Saison"},{"pick","Verein wählen"},{"title","Fussball-Pyramide"} };

        void UpdateTop(bool inGame)
        {
            string status = G == null ? "Die komplette deutsche Fußballpyramide" : "Saison " + Sl(G.S.season) + " · " + (G.SeasonDone ? "Saison beendet" : "Spieltag " + G.S.day + " von " + G.MaxDay);
            if (wide)
            {
                string pn; PageNames.TryGetValue(tab, out pn);
                topTitle.text = (pn ?? "").ToUpperInvariant();
                topSub.text = status;
                K.Clear(topActions);
                if (inGame) GameActions(topActions, 120, 420);
            }
            else
            {
                topTitle.text = inGame ? G.T(G.S.fav).name : "FUSSBALL-PYRAMIDE";
                topSub.text = status;
            }
        }

        // Weiter-Knöpfe (Kopfzeile am PC, Übersicht am Handy)
        void GameActions(Transform p, float h, float w)
        {
            if (!G.SeasonDone)
            {
                K.Btn(p, "▶  Nächstes Spiel", () => { PlayToFavMatch(); Save(); Render(); }, K.Acc, h, w, 40, Color.white);
                K.Btn(p, "Bis Saisonende", () => { G.SimToEnd(); Save(); Render(); }, K.Card2, h, w * .8f, 36);
            }
            else K.Btn(p, "Saison abschließen → " + Sl(G.S.season + 1), () => { G.EndSeason(); showAllLog = false; Save(); Go("season"); }, K.Gold, h, w * 1.4f, 38, Color.black);
        }

        static string Sl(int s) { return s + "/" + ((s + 1) % 100).ToString("00"); }

        void NavClick(string key)
        {
            if (key == "table" || key == "games") { viewLeague = null; viewRound = -1; }
            if (key == "squad") viewTeam = -1;
            if (key == "leagues") vbView = null;
            Go(key);
        }
        bool NavOn(string key) { return tab == key || (key == "leagues" && tab == "team"); }

        void BuildBottomNav()
        {
            K.Clear(navBar);
            foreach (var it in NavItems)
            {
                string key = it[0]; bool on = NavOn(key);
                var b = K.Btn(navBar, it[0] == "home" ? "Start" : it[0] == "games" ? "Spiele" : it[1], () => NavClick(key), on ? K.AccD : K.Card, -1, -1, 30, on ? Color.white : K.Mut);
                var le = b.GetComponent<LayoutElement>(); le.minHeight = 0; le.preferredHeight = -1; le.flexibleWidth = 1;
            }
        }

        void BuildSide(bool inGame)
        {
            K.Clear(side);
            K.Label(side, "FUSSBALL-PYRAMIDE", 44, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold, -1, false);
            K.Label(side, "Von der Kreisklasse bis zur Bundesliga", 26, K.Mut, TextAnchor.MiddleLeft, FontStyle.Normal, -1, false);
            K.Gap(side, 30);
            if (inGame)
            {
                var t = G.T(G.S.fav); var l = G.LeagueOf(G.S.fav);
                var card = K.VBox(side, 10, 24, K.Card2, "Verein");
                var cr = K.HBox(card, 110, 20); K.Crest(cr, t, 96);
                var cv = K.VBox(cr, 2); K.LE(cv, -1, -1, 1).minWidth = 0;
                K.Cell(cv, t.name, -1, TextAnchor.MiddleLeft, K.Txt, FontStyle.Bold, 32).GetComponent<LayoutElement>().preferredHeight = 44;
                if (l != null)
                {
                    var tb = G.Table(l); int pos = tb.FindIndex(r => r.id == G.S.fav);
                    K.Cell(cv, "Platz " + (pos + 1) + " · " + tb[pos].p + " Pkt.", -1, TextAnchor.MiddleLeft, K.Acc, FontStyle.Normal, 28).GetComponent<LayoutElement>().preferredHeight = 38;
                }
                if (l != null) K.Cell(card, l.name, -1, TextAnchor.MiddleLeft, K.Mut, FontStyle.Normal, 26).GetComponent<LayoutElement>().preferredHeight = 36;
                K.Click(card, () => { viewTeam = G.S.fav; Go("team"); });
                K.Gap(side, 24);
                foreach (var it in NavItems)
                {
                    string key = it[0]; bool on = NavOn(key);
                    var b = K.Btn(side, "   " + it[1], () => NavClick(key), on ? K.AccD : K.Card, 96, -1, 36, on ? Color.white : K.Mut);
                    b.GetComponentInChildren<Text>().alignment = TextAnchor.MiddleLeft;
                }
                var spacer = K.Rect("Platz", side); K.LE(spacer, -1, -1, -1, 1);
                K.Label(side, "Leertaste: nächstes Spiel · Esc: Übersicht", 24, K.Mut, TextAnchor.MiddleLeft);
                K.Btn(side, "Hauptmenü", () => { Save(); G = null; Go("title"); }, K.Card, 84, -1, 30, K.Mut);
            }
        }

        // ---------- Start ohne Spiel ----------
        void Title()
        {
            var cols = wide ? Cols(1, 1.4f, 1) : Cols(1);
            var mid = wide ? cols[1] : cols[0];
            if (wide) K.Gap(mid, 120);
            var c = K.CardBox(mid, 56, 24);
            K.Label(c, "FUSSBALL-PYRAMIDE", wide ? 96 : 72, K.Txt, TextAnchor.MiddleCenter, FontStyle.Bold);
            K.Label(c, "Von der Kreisklasse bis zur Bundesliga – jede Liga, jeder Verein.", K.FS, K.Mut, TextAnchor.MiddleCenter);
            K.Gap(c, 12);
            if (Store.HasSave) K.Btn(c, "Spiel fortsetzen", ContinueGame, K.Acc, 130, -1, 44, Color.white);
            K.Btn(c, confirmNew ? "Wirklich neu beginnen? Spielstand wird ersetzt" : "Neues Spiel", () =>
            {
                if (Store.HasSave && !confirmNew) { confirmNew = true; Render(); return; }
                confirmNew = false; NewGame();
            }, Store.HasSave ? K.Card2 : K.Acc, 130, -1, 44, Color.white);
            if (error != null) K.Label(c, error, 28, K.Down);
            var info = K.CardBox(mid);
            try
            {
                if (G == null) { var w = Store.LoadWorld(); K.Label(info, w.teams.Count.ToString("N0").Replace(',', '.') + " Vereine · " + w.leagues.Count + " Ligen · " + Crests() + " Wappen", K.FSs, K.Mut, TextAnchor.MiddleCenter); }
            }
            catch (Exception e) { K.Label(info, "Daten fehlen: " + e.Message, K.FSs, K.Down); }
            K.Label(info, "Unity-Version · Phase 1: Ligabetrieb mit Auf- und Abstieg in der ganzen Pyramide", 28, K.Mut, TextAnchor.MiddleCenter);
        }
        static int crestCount = -1;
        static int Crests() { if (crestCount < 0) crestCount = Resources.LoadAll<Texture2D>("Crests").Length; return crestCount; }

        void ContinueGame()
        {
            try { G = Game.FromState(Store.Load(), Store.LoadNames()); error = null; Go(G.S.fav >= 0 ? "home" : "pick"); }
            catch (Exception e) { error = "Spielstand konnte nicht geladen werden: " + e.Message; Debug.LogException(e); Render(); }
        }
        void NewGame()
        {
            G = Game.NewGame(Store.LoadWorld(), Store.LoadNames(), Environment.TickCount & 0x7fffffff);
            query = ""; Go("pick");
        }

        // ---------- Verein wählen ----------
        void Pick()
        {
            var cols = Cols(1, 1.6f);
            var c = K.CardBox(cols[0]);
            K.Label(c, "Wähle deinen Verein", K.FSh, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold);
            K.Label(c, "Suche nach Name oder Ort – oder stöbere unter „Ligen“.", K.FSs, K.Mut);
            SearchField(c, "Verein suchen …", query, v => { query = v; FillResults(); });
            K.Btn(c, "Ligen durchsuchen", () => Go("leagues"));
            resultsBox = K.VBox(cols[1], 10);
            FillResults();
        }
        void FillResults()
        {
            if (resultsBox == null) return; K.Clear(resultsBox);
            IEnumerable<Team> list;
            string q = (query ?? "").Trim().ToLowerInvariant();
            if (q.Length < 2) { list = G.L("bl").teams.Select(id => G.T(id)); K.Label(resultsBox, "Bundesliga", K.FSs, K.Mut); }
            else list = G.S.teams.Where(t => G.LeagueOf(t.id) != null && !G.LeagueOf(t.id).foreign && t.name.ToLowerInvariant().Contains(q)).OrderBy(t => G.LeagueOf(t.id).level).Take(50);
            int n = 0;
            foreach (var t in list) { TeamLine(resultsBox, t.id, () => { viewTeam = t.id; Go("team"); }); n++; }
            if (n == 0) K.Label(resultsBox, "Kein Verein gefunden.", K.FSs, K.Mut);
        }
        void SearchField(Transform p, string placeholder, string value, Action<string> changed)
        {
            var r = K.Rect("Eingabe", p); var img = r.gameObject.AddComponent<Image>(); img.color = K.Card2; K.LE(r, -1, 110);
            var tr = K.Label(r, "", K.FS, K.Txt, TextAnchor.MiddleLeft, FontStyle.Normal, -1, false); tr.supportRichText = false; K.Fill(tr.rectTransform); tr.rectTransform.offsetMin = new Vector2(28, 0); tr.rectTransform.offsetMax = new Vector2(-28, 0);
            var ph = K.Label(r, placeholder, K.FS, K.Mut, TextAnchor.MiddleLeft, FontStyle.Italic, -1, false); K.Fill(ph.rectTransform); ph.rectTransform.offsetMin = new Vector2(28, 0); ph.rectTransform.offsetMax = new Vector2(-28, 0);
            var inp = r.gameObject.AddComponent<InputField>(); inp.textComponent = tr; inp.placeholder = ph; inp.targetGraphic = img; inp.text = value ?? "";
            inp.onValueChanged.AddListener(v => changed(v));
            if (wide) inp.ActivateInputField();
        }

        // ---------- Übersicht ----------
        void Home()
        {
            int fav = G.S.fav; var t = G.T(fav); var l = G.LeagueOf(fav);
            var cols = Cols(1, 1.25f, 1);

            // Vereinskarte
            var head = K.CardBox(cols[0], 32, 10);
            var hr = K.HBox(head, 180, 28); K.Crest(hr, t, 160);
            var hv = K.VBox(hr, 4); K.LE(hv, -1, -1, 1).minWidth = 0;
            K.Label(hv, t.name, 46, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold);
            if (l != null)
            {
                var tb = G.Table(l); int pos = tb.FindIndex(r => r.id == fav);
                K.Label(hv, l.name, K.FSs, K.Acc);
                var stats = K.HBox(head, 120, 16);
                Stat(stats, "Platz", (pos + 1) + ". / " + tb.Count); Stat(stats, "Punkte", tb[pos].p.ToString()); Stat(stats, "Tore", tb[pos].tf + ":" + tb[pos].tg); Stat(stats, "Stärke", t.r.ToString("0.0"));
            }

            // Nächstes Spiel
            var fx = G.FixturesOf(fav);
            var next = fx.FirstOrDefault(x => x.Value.hg < 0);
            var nc = K.CardBox(cols[0], 32, 14);
            if (!G.SeasonDone && next.Value != null)
            {
                K.Label(nc, "NÄCHSTES SPIEL · " + (next.Key + 1) + ". SPIELTAG", 28, K.Mut, TextAnchor.MiddleLeft, FontStyle.Bold);
                BigMatch(nc, next.Value);
                if (!wide) { var bh = K.HBox(nc, 120, 16); GameActions(bh, 120, -1); }
            }
            else
            {
                K.Label(nc, "Die Saison ist zu Ende.", K.FS, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold);
                if (!wide) GameActions(nc, 130, -1);
            }

            // Letzte Ergebnisse
            var done = fx.Where(x => x.Value.hg >= 0).Reverse().Take(6).ToList();
            if (done.Count > 0)
            {
                var rc = K.CardBox(cols[0], 24, 6); K.Label(rc, "LETZTE SPIELE", 28, K.Mut, TextAnchor.MiddleLeft, FontStyle.Bold);
                foreach (var x in done) MatchLine(rc, x.Value, false, fav);
            }

            // Tabelle
            if (l != null)
            {
                var tc = K.CardBox(cols[1], 20, 2); K.Label(tc, l.name.ToUpperInvariant(), 28, K.Mut, TextAnchor.MiddleLeft, FontStyle.Bold);
                var tb = G.Table(l); int pos = tb.FindIndex(r => r.id == fav);
                TableHeader(tc);
                int a = 0, b = tb.Count;
                if (!wide) { a = Mathf.Clamp(pos - 3, 0, Mathf.Max(0, tb.Count - 7)); b = Mathf.Min(tb.Count, a + 7); }
                for (int i = a; i < b; i++) TableRow(tc, l, tb, i);
                if (!wide) K.Btn(tc, "Ganze Tabelle", () => { viewLeague = l.id; Go("table"); }, K.Card2, 100);
            }

            // Spieltag der Liga
            if (l != null && l.played > 0)
            {
                int r = l.played - 1;
                var mc = K.CardBox(cols[2], 24, 6); K.Label(mc, (r + 1) + ". SPIELTAG · ERGEBNISSE", 28, K.Mut, TextAnchor.MiddleLeft, FontStyle.Bold);
                foreach (var m in l.rounds[r].m) MatchLine(mc, m, false, fav);
            }
            if (l != null && l.played < l.rounds.Count && wide)
            {
                var mc = K.CardBox(cols[2], 24, 6); K.Label(mc, (l.played + 1) + ". SPIELTAG · VORSCHAU", 28, K.Mut, TextAnchor.MiddleLeft, FontStyle.Bold);
                foreach (var m in l.rounds[l.played].m) MatchLine(mc, m, false, fav);
            }
            if (!wide) { var mc = K.CardBox(content); K.Btn(mc, "Zum Hauptmenü", () => { Save(); G = null; Go("title"); }, K.Card2, 100); }
        }

        void Stat(Transform p, string label, string value)
        {
            var v = K.VBox(p, 0, 0, null, "Wert"); K.LE(v, -1, -1, 1).minWidth = 0;
            K.Label(v, label.ToUpperInvariant(), 24, K.Mut, TextAnchor.MiddleLeft, FontStyle.Normal, -1, false);
            K.Label(v, value, 44, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold, -1, false);
        }

        void BigMatch(Transform p, Match m)
        {
            var h = G.T(m.h); var a = G.T(m.a);
            var r = K.HBox(p, 260, 20);
            Side(r, h); K.Cell(r, m.hg >= 0 ? m.hg + " : " + m.ag : "vs", 140, TextAnchor.MiddleCenter, K.Mut, FontStyle.Bold, 48); Side(r, a);
        }
        void Side(Transform p, Team t)
        {
            var v = K.VBox(p, 10); K.LE(v, -1, -1, 1).minWidth = 0; v.GetComponent<VerticalLayoutGroup>().childAlignment = TextAnchor.UpperCenter;
            v.GetComponent<VerticalLayoutGroup>().childControlWidth = false; v.GetComponent<VerticalLayoutGroup>().childForceExpandWidth = false;
            K.Crest(v, t, 150);
            var n = K.Label(v, t.name, 32, t.id == G.S.fav ? K.Acc : K.Txt, TextAnchor.UpperCenter, FontStyle.Bold); n.rectTransform.sizeDelta = new Vector2(380, 90); K.LE(n, 380, 90);
        }

        // spielt Spieltage, bis Mein Verein gespielt hat (kleine Ligen spielen nicht an jedem Spieltag)
        void PlayToFavMatch()
        {
            var l = G.LeagueOf(G.S.fav); int before = l != null ? l.played : 0; int g = 0;
            while (!G.SeasonDone && l != null && l.played == before && g++ < 100) G.NextDay();
        }

        void MatchLine(Transform p, Match m, bool big, int fav = -1)
        {
            var r = K.HBox(p, big ? 130 : 84, 14);
            var h = G.T(m.h); var a = G.T(m.a);
            K.Cell(r, h.name, -1, TextAnchor.MiddleRight, m.h == G.S.fav ? K.Acc : K.Txt, m.h == G.S.fav ? FontStyle.Bold : FontStyle.Normal, big ? 36 : 30);
            K.Crest(r, h, big ? 90 : 56);
            string sc = m.hg >= 0 ? m.hg + " : " + m.ag : "– : –";
            Color col = K.Txt;
            if (fav >= 0 && m.hg >= 0 && (m.h == fav || m.a == fav)) { int me = m.h == fav ? m.hg : m.ag, op = m.h == fav ? m.ag : m.hg; col = me > op ? K.Up : me < op ? K.Down : K.Rel; }
            K.Cell(r, sc, big ? 150 : 110, TextAnchor.MiddleCenter, col, FontStyle.Bold, big ? 44 : 32);
            K.Crest(r, a, big ? 90 : 56);
            K.Cell(r, a.name, -1, TextAnchor.MiddleLeft, m.a == G.S.fav ? K.Acc : K.Txt, m.a == G.S.fav ? FontStyle.Bold : FontStyle.Normal, big ? 36 : 30);
        }

        void TeamLine(Transform p, int id, Action on)
        {
            var t = G.T(id); var l = G.LeagueOf(id);
            var r = K.HBox(p, 120, 20, 20, K.Card);
            K.Crest(r, t, 84);
            var v = K.VBox(r, 2); K.LE(v, -1, -1, 1).minWidth = 0;
            K.Cell(v, t.name, -1, TextAnchor.MiddleLeft, K.Txt, FontStyle.Bold).GetComponent<LayoutElement>().preferredHeight = 50;
            K.Cell(v, l != null ? l.name + " · Stufe " + l.level : "", -1, TextAnchor.MiddleLeft, K.Mut, FontStyle.Normal, 28).GetComponent<LayoutElement>().preferredHeight = 40;
            K.Cell(r, t.r.ToString("0.0"), 90, TextAnchor.MiddleRight, K.Mut);
            K.Click(r, on);
        }

        // ---------- Tabelle ----------
        League CurLeague() { return G.L(viewLeague) ?? (G.S.fav >= 0 ? G.LeagueOf(G.S.fav) : null) ?? G.L("bl"); }

        void TableTab()
        {
            var l = CurLeague(); viewLeague = l.id;
            var cols = Cols(1.6f, 1);
            LeagueHead(cols[0], l);
            var tb = G.Table(l);
            var c = K.CardBox(cols[0], 16, 0);
            TableHeader(c);
            for (int i = 0; i < tb.Count; i++) TableRow(c, l, tb, i);
            var lg = K.HBox(cols[0], 60, 24);
            Legend(lg, K.Up, "Aufstieg"); Legend(lg, K.Rel, "Relegation"); Legend(lg, K.Down, "Abstieg");
            if (l.played > 0)
            {
                int r = l.played - 1;
                var mc = K.CardBox(cols[1], 24, 6); K.Label(mc, (r + 1) + ". SPIELTAG", 28, K.Mut, TextAnchor.MiddleLeft, FontStyle.Bold);
                foreach (var m in l.rounds[r].m) MatchLine(mc, m, false, -1);
                K.Btn(mc, "Ganzer Spielplan", () => { viewRound = -1; Go("games"); }, K.Card2, 96);
            }
            else K.Btn(cols[1], "Spielplan", () => { viewRound = -1; Go("games"); });
            LeagueLinks(cols[1], l);
        }
        void Legend(Transform p, Color c, string s) { var b = K.Rect("Farbe", p); b.gameObject.AddComponent<Image>().color = c; K.LE(b, 24, 24); K.Cell(p, s, 220, TextAnchor.MiddleLeft, K.Mut, FontStyle.Normal, 28); }

        void TableHeader(Transform p)
        {
            var h = K.HBox(p, 60, 10, 8);
            K.Cell(h, "", 8, TextAnchor.MiddleCenter); K.Cell(h, "#", 48, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 26); K.Cell(h, "", 56, TextAnchor.MiddleCenter);
            K.Cell(h, "Verein", -1, TextAnchor.MiddleLeft, K.Mut, FontStyle.Normal, 26);
            K.Cell(h, "Sp", 64, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 26);
            if (wide) { K.Cell(h, "S", 56, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 26); K.Cell(h, "U", 56, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 26); K.Cell(h, "N", 56, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 26); K.Cell(h, "Tore", 110, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 26); }
            K.Cell(h, "Diff", 84, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 26); K.Cell(h, "Pkt", 84, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 26);
        }

        void TableRow(Transform p, League l, List<Row> tbl, int i)
        {
            var row = tbl[i]; var t = G.T(row.id); bool me = row.id == G.S.fav;
            var r = K.HBox(p, 78, 10, 8, me ? K.Card2 : (Color?)null);
            int z = G.Zone(l, i, tbl.Count);
            var bar = K.Rect("Zone", r); bar.gameObject.AddComponent<Image>().color = z == 1 ? K.Up : z == 2 || z == -2 ? K.Rel : z == -1 ? K.Down : new Color(0, 0, 0, 0); K.LE(bar, 8, 60);
            K.Cell(r, (i + 1).ToString(), 48, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 30);
            K.Crest(r, t, 52);
            K.Cell(r, t.name, -1, TextAnchor.MiddleLeft, me ? K.Acc : K.Txt, me ? FontStyle.Bold : FontStyle.Normal, 32);
            K.Cell(r, row.sp.ToString(), 64, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 30);
            if (wide)
            {
                K.Cell(r, row.s.ToString(), 56, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 30); K.Cell(r, row.u.ToString(), 56, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 30); K.Cell(r, row.n.ToString(), 56, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 30);
                K.Cell(r, row.tf + ":" + row.tg, 110, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 30);
            }
            K.Cell(r, (row.Diff > 0 ? "+" : "") + row.Diff, 84, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 30);
            K.Cell(r, row.p.ToString(), 84, TextAnchor.MiddleCenter, K.Txt, FontStyle.Bold, 32);
            int id = row.id; K.Click(r, () => { viewTeam = id; Go("team"); });
        }

        void LeagueHead(Transform p, League l)
        {
            var c = K.CardBox(p, 28, 6);
            K.Label(c, l.name, K.FSh, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold);
            string vb; string info = l.foreign ? "Ausland" : "Stufe " + l.level + (l.vb != "" && VB.TryGetValue(l.vb, out vb) ? " · " + vb : "") + (l.kreis != "" ? " · Kreis " + l.kreis : "");
            K.Label(c, info + " · " + l.teams.Count + " Vereine · " + l.played + "/" + l.rounds.Count + " Spieltage", K.FSs, K.Mut);
        }

        void LeagueLinks(Transform p, League l)
        {
            if (l.foreign) return;
            var c = K.CardBox(p, 24, 10);
            League up = null;
            if (l.level == 2) up = G.L("bl"); else if (l.level == 3) up = G.L("bl2"); else if (l.level == 4) up = G.L("l3");
            else if (l.level == 5) up = G.L(G.RegionOf(l.vb));
            else if (l.level > 5) up = G.LeagueByName(l.up) ?? G.S.leagues.FirstOrDefault(u => !u.foreign && u.level == l.level - 1 && u.vbs.Contains(l.vb));
            if (up != null) { K.Label(c, "NÄCHSTHÖHERE LIGA", 26, K.Mut, TextAnchor.MiddleLeft, FontStyle.Bold); var lid = up.id; K.Btn(c, "▲  " + up.name, () => { viewLeague = lid; Go("table"); }, K.Card2, 90, -1, 32); }
            List<League> subs;
            if (l.level == 1) subs = new List<League> { G.L("bl2") };
            else if (l.level == 2) subs = new List<League> { G.L("l3") };
            else if (l.level == 3) subs = Game.RegionalLeagues.Select(x => G.L(x)).ToList();
            else if (l.level == 4) subs = G.S.leagues.Where(x => !x.foreign && x.level == 5 && G.RegionOf(x.vb) == l.id).ToList();
            else subs = G.S.leagues.Where(x => !x.foreign && x.level == l.level + 1 && x.up == l.name).ToList();
            if (subs.Count > 0)
            {
                K.Label(c, "UNTERBAU", 26, K.Mut, TextAnchor.MiddleLeft, FontStyle.Bold);
                foreach (var s in subs.Where(x => x != null)) { var sid = s.id; K.Btn(c, "▼  " + s.name, () => { viewLeague = sid; Go("table"); }, K.Card2, 90, -1, 32); }
            }
        }

        // ---------- Spielplan ----------
        void Games()
        {
            var l = CurLeague(); viewLeague = l.id;
            if (viewRound < 0) viewRound = Mathf.Clamp(l.played > 0 && (l.played >= l.rounds.Count || G.S.fav < 0 || G.LeagueOf(G.S.fav) != l) ? l.played - 1 : l.played, 0, l.rounds.Count - 1);
            var cols = Cols(1.3f, 1);
            LeagueHead(cols[0], l);
            var nav = K.HBox(cols[0], 110, 16);
            K.Btn(nav, "◀", () => { viewRound = Mathf.Max(0, viewRound - 1); Render(); }, K.Card2, 110, 140, 44);
            K.Cell(nav, (viewRound + 1) + ". Spieltag von " + l.rounds.Count, -1, TextAnchor.MiddleCenter, K.Txt, FontStyle.Bold, 38);
            K.Btn(nav, "▶", () => { viewRound = Mathf.Min(l.rounds.Count - 1, viewRound + 1); Render(); }, K.Card2, 110, 140, 44);
            var c = K.CardBox(cols[0], 16, 6);
            foreach (var m in l.rounds[viewRound].m) MatchLine(c, m, false, -1);
            int spielfrei = l.teams.Count % 2 == 1 ? l.teams.FirstOr(id => !l.rounds[viewRound].m.Any(m => m.h == id || m.a == id), -1) : -1;
            if (spielfrei >= 0) K.Label(c, "Spielfrei: " + G.T(spielfrei).name, 28, K.Mut);
            if (G.S.fav >= 0 && G.LeagueOf(G.S.fav) == l)
            {
                var fc = K.CardBox(cols[1], 16, 6); K.Label(fc, "SPIELE VON " + G.T(G.S.fav).name.ToUpperInvariant(), 28, K.Mut, TextAnchor.MiddleLeft, FontStyle.Bold);
                foreach (var x in G.FixturesOf(G.S.fav)) MatchLine(fc, x.Value, false, G.S.fav);
            }
            else LeagueLinks(cols[1], l);
        }

        // ---------- Kader ----------
        void SquadTab()
        {
            int id = viewTeam >= 0 ? viewTeam : G.S.fav; var t = G.T(id);
            var sq = G.Squad(id);
            var c = K.CardBox(content, 24, 6);
            var hr = K.HBox(c, 120, 24); K.Crest(hr, t, 110);
            var hv = K.VBox(hr, 2); K.LE(hv, -1, -1, 1).minWidth = 0;
            K.Label(hv, t.name, 42, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold);
            var ps0 = sq.Select(x => G.S.players[x]).ToList();
            K.Label(hv, sq.Count + " Spieler · Stärke " + t.r.ToString("0.0") + " · Ø Alter " + (ps0.Count > 0 ? ps0.Average(x => x.a).ToString("0.0") : "-") + " · Kaderwert " + Util.Money(ps0.Sum(x => (double)G.PlayerValue(x))), K.FSs, K.Mut);
            var names = new Dictionary<string, string> { { "TW", "Torwart" }, { "AB", "Abwehr" }, { "MF", "Mittelfeld" }, { "ST", "Sturm" } };
            var cols = Cols(1, 1);
            int ci = 0;
            foreach (var pos in Game.Pos)
            {
                var ps = ps0.Where(x => x.p == pos).OrderByDescending(x => x.s).ToList(); if (ps.Count == 0) continue;
                var col = cols[pos == "TW" || pos == "AB" ? 0 : 1]; ci++;
                var pc = K.CardBox(col, 16, 0);
                K.Label(pc, names[pos].ToUpperInvariant(), 28, K.Acc, TextAnchor.MiddleLeft, FontStyle.Bold);
                var hh = K.HBox(pc, 50, 10, 8);
                K.Cell(hh, "Nr", 64, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 24); K.Cell(hh, "Name", -1, TextAnchor.MiddleLeft, K.Mut, FontStyle.Normal, 24);
                K.Cell(hh, "Nat.", 96, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 24); K.Cell(hh, "Alter", 70, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 24);
                K.Cell(hh, "Stärke", 90, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 24); K.Cell(hh, "Marktwert", 200, TextAnchor.MiddleRight, K.Mut, FontStyle.Normal, 24);
                foreach (var p in ps)
                {
                    var r = K.HBox(pc, 76, 10, 8);
                    K.Cell(r, p.no > 0 ? p.no.ToString() : "", 64, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 30);
                    K.Cell(r, p.n, -1, TextAnchor.MiddleLeft, K.Txt, FontStyle.Normal, 32);
                    K.Cell(r, Short(p.nat), 96, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 28);
                    K.Cell(r, p.a.ToString(), 70, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 30);
                    K.Cell(r, p.s.ToString("0"), 90, TextAnchor.MiddleCenter, StrColor(p.s, t.r), FontStyle.Bold, 32);
                    K.Cell(r, Util.Money(G.PlayerValue(p)), 200, TextAnchor.MiddleRight, K.Mut, FontStyle.Normal, 28);
                }
            }
        }
        static Color StrColor(float s, float teamR) { return s >= teamR + 4 ? K.Up : s <= teamR - 6 ? K.Mut : K.Txt; }
        static string Short(string nat) { if (string.IsNullOrEmpty(nat)) return ""; if (nat.StartsWith("X:")) return nat.Substring(2, Math.Min(3, nat.Length - 2)).ToUpperInvariant(); return nat == "DE" ? "GER" : nat; }

        // ---------- Ligen ----------
        void Leagues()
        {
            if (vbView != null)
            {
                string vbn; VB.TryGetValue(vbView, out vbn);
                var hc = K.CardBox(content, 24, 8); K.Label(hc, vbn ?? vbView, K.FSh, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold);
                var bh = K.HBox(hc, 96, 16); K.Btn(bh, "◀  Alle Verbände", () => { vbView = null; Render(); }, K.Card2, 96, wide ? 420 : -1);
                var groups = G.S.leagues.Where(l => !l.foreign && l.level >= 5 && (l.vb == vbView || l.vbs.Contains(vbView))).GroupBy(l => l.level).OrderBy(x => x.Key).ToList();
                var cols = Cols(1, 1, 1); int i = 0;
                foreach (var g in groups)
                {
                    var c = K.CardBox(cols[i++ % cols.Length], 20, 8); K.Label(c, "STUFE " + g.Key + " · " + LevelName(g.First()).ToUpperInvariant(), 28, K.Acc, TextAnchor.MiddleLeft, FontStyle.Bold);
                    foreach (var l in g.OrderBy(x => x.name)) { var lid = l.id; K.Btn(c, l.name + "  (" + l.teams.Count + ")", () => { viewLeague = lid; Go("table"); }, K.Card2, 84, -1, 30); }
                }
                return;
            }
            var cs = Cols(1, 1, 1);
            var pc = K.CardBox(cs[0], 20, 8); K.Label(pc, "PROFILIGEN", 28, K.Acc, TextAnchor.MiddleLeft, FontStyle.Bold);
            foreach (var id in Game.ProLeagues) { var l = G.L(id); if (l == null) continue; K.Btn(pc, l.name, () => { viewLeague = id; Go("table"); }, K.Card2, 88, -1, 32); }
            var vc = K.CardBox(cs[1], 20, 8); K.Label(vc, "LANDESVERBÄNDE", 28, K.Acc, TextAnchor.MiddleLeft, FontStyle.Bold);
            foreach (var kv in VB.OrderBy(x => x.Value))
            {
                string code = kv.Key; int n = G.S.leagues.Count(l => !l.foreign && l.level >= 5 && (l.vb == code || l.vbs.Contains(code))); if (n == 0) continue;
                K.Btn(vc, kv.Value + "  ·  " + n + " Ligen", () => { vbView = code; Render(); }, K.Card2, 88, -1, 32);
            }
            var fc = K.CardBox(cs[2], 20, 8); K.Label(fc, "AUSLAND", 28, K.Acc, TextAnchor.MiddleLeft, FontStyle.Bold);
            foreach (var l in G.S.leagues.Where(x => x.foreign)) { var lid = l.id; K.Btn(fc, l.name, () => { viewLeague = lid; Go("table"); }, K.Card2, 88, -1, 32); }
        }
        static string LevelName(League l)
        {
            var n = l.name; foreach (var k in new[] { "Oberliga", "Verbandsliga", "Landesliga", "Landesklasse", "Bezirksliga", "Bezirksklasse", "Kreisoberliga", "Kreisliga", "Kreisklasse", "Kreisstaffel", "A-Klasse", "B-Klasse", "C-Klasse", "Thüringenliga", "Sachsenliga", "Bayernliga", "Hessenliga", "Westfalenliga" }) if (n.Contains(k)) return k;
            return n.Split(' ')[0];
        }

        // ---------- Verein ----------
        void TeamTab()
        {
            int id = viewTeam >= 0 ? viewTeam : G.S.fav; var t = G.T(id); var l = G.LeagueOf(id);
            var cols = Cols(1, 1.3f);
            var c = K.CardBox(cols[0], 32, 12);
            var hr = K.HBox(c, 200, 28); K.Crest(hr, t, 180);
            var hv = K.VBox(hr, 4); K.LE(hv, -1, -1, 1).minWidth = 0;
            K.Label(hv, t.name, 46, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold);
            if (l != null)
            {
                var tb = G.Table(l); int pos = tb.FindIndex(r => r.id == id);
                K.Label(hv, l.name, K.FSs, K.Acc);
                var stats = K.HBox(c, 120, 16);
                Stat(stats, "Platz", (pos + 1) + ". / " + tb.Count); Stat(stats, "Punkte", tb[pos].p.ToString()); Stat(stats, "Stärke", t.r.ToString("0.0"));
            }
            if (G.S.fav < 0)
            {
                K.Btn(c, "Diesen Verein übernehmen", () => { G.S.fav = id; viewTeam = -1; viewLeague = null; Save(); Go("home"); }, K.Acc, 130, -1, 42, Color.white);
                K.Btn(c, "◀  Zurück zur Suche", () => Go("pick"), K.Card2, 100);
            }
            var bh = K.HBox(c, 110, 16);
            K.Btn(bh, "Kader", () => { viewTeam = id; Go("squad"); });
            if (l != null) { var lid = l.id; K.Btn(bh, "Tabelle", () => { viewLeague = lid; Go("table"); }); }
            var fx = G.FixturesOf(id);
            if (fx.Count > 0)
            {
                var fc = K.CardBox(cols[1], 16, 6); K.Label(fc, "SPIELE", 28, K.Mut, TextAnchor.MiddleLeft, FontStyle.Bold);
                foreach (var x in fx) MatchLine(fc, x.Value, false, id);
            }
        }

        // ---------- Saison ----------
        void SeasonTab()
        {
            int fav = G.S.fav; var h = G.S.hist.FirstOrDefault(x => x.team == fav);
            var cols = Cols(1, 1.6f);
            var c = K.CardBox(cols[0], 24, 6); K.Label(c, "Vereinsgeschichte", K.FSh, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold);
            if (h == null || h.e.Count == 0) K.Label(c, "Noch keine Saison abgeschlossen.", K.FSs, K.Mut);
            else foreach (var e in h.e)
                {
                    var r = K.HBox(c, 76, 12);
                    K.Cell(r, Sl(e.season), 150, TextAnchor.MiddleLeft, K.Mut, FontStyle.Normal, 32);
                    K.Cell(r, e.league, -1, TextAnchor.MiddleLeft, K.Txt, FontStyle.Normal, 32);
                    K.Cell(r, e.pos + ". / " + e.n, 140, TextAnchor.MiddleRight, e.pos == 1 ? K.Gold : K.Txt, FontStyle.Bold, 32);
                }
            if (G.S.log.Count == 0) return;
            var lg = G.S.log[0]; string fn = G.T(fav).name;
            var lc = K.CardBox(cols[1], 24, 6); K.Label(lc, "SAISON " + Sl(lg.season) + " – MELDUNGEN", 28, K.Acc, TextAnchor.MiddleLeft, FontStyle.Bold);
            var mine = lg.lines.Where(x => x.Contains(fn)).ToList();
            foreach (var x in mine) K.Label(lc, "★ " + x, 32, K.Gold);
            int cap = wide ? 60 : 25;
            var lines = showAllLog ? lg.lines.Take(400).ToList() : lg.lines.Where(x => !x.Contains(fn)).Take(cap).ToList();
            foreach (var x in lines) K.Label(lc, x, 30, K.Txt);
            if (!showAllLog && lg.lines.Count > cap) K.Btn(lc, "Mehr anzeigen (" + lg.lines.Count + " Meldungen)", () => { showAllLog = true; Render(); }, K.Card2, 96);
        }
    }
}
