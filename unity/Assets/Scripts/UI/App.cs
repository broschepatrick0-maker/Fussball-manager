// Oberfläche: Start, Tabelle, Spielplan, Kader, Ligen, Saison – am PC mit Seitenleiste und mehrspaltig, auf dem Handy im Hochformat. Pokale siehe AppCups.cs.
using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;
using FP.Core;

namespace FP.UI
{
    public partial class App : MonoBehaviour
    {
        Game G;
        RectTransform root, topBar, navBar, content, resultsBox, sideNav, sideClub, topActions;
        ScrollRect scroll; CanvasScaler scaler; RectTransform canvasRT;
        Text topTitle, topSub;
        string tab = "title"; string lastTab = "";
        int viewTeam = -1; string viewLeague; int viewRound = -1; string vbView; string query = "";
        bool showAllLog; bool confirmNew; string error;
        Vector2 lastScreen; Rect lastSafe; bool desk; bool built;
        const float SideW = 420, TopH = 170;

        static readonly Dictionary<string, string> VB = new Dictionary<string, string> {
            {"BY","Bayern"},{"BA","Baden"},{"SB","Südbaden"},{"WU","Württemberg"},{"HE","Hessen"},{"SW","Südwest"},{"RL","Rheinland"},{"SL","Saarland"},
            {"MR","Mittelrhein"},{"NR","Niederrhein"},{"WF","Westfalen"},{"NI","Niedersachsen"},{"HB","Bremen"},{"HH","Hamburg"},{"SH","Schleswig-Holstein"},
            {"MV","Mecklenburg-Vorpommern"},{"BB","Brandenburg"},{"BE","Berlin"},{"ST","Sachsen-Anhalt"},{"SN","Sachsen"},{"TH","Thüringen"} };
        static readonly string[][] NavItems = { new[] { "home", "Übersicht" }, new[] { "table", "Tabelle" }, new[] { "games", "Spielplan" }, new[] { "squad", "Kader" }, new[] { "cups", "Pokale" }, new[] { "leagues", "Ligen" }, new[] { "season", "Saison" } };

        // ---------- Gerüst ----------
        void Start()
        {
            K.Init();
            BuildShell();
            Render();
        }
        static bool IsDesk() { return Screen.width > Screen.height * 1.1f; }

        // PC (Querformat): Seitenleiste links, Kopfzeile mit Aktionen, breiter Inhalt. Handy (Hochformat): Kopf oben, Navigation unten.
        void BuildShell()
        {
            if (canvasRT != null) Destroy(canvasRT.gameObject);
            desk = IsDesk(); K.Desk = desk; built = true;
            var cgo = new GameObject("Canvas", typeof(RectTransform));
            cgo.transform.SetParent(transform, false);
            var canvas = cgo.AddComponent<Canvas>(); canvas.renderMode = RenderMode.ScreenSpaceOverlay; canvas.pixelPerfect = false;
            scaler = cgo.AddComponent<CanvasScaler>(); scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = desk ? new Vector2(2880, 1620) : new Vector2(1080, 1920); scaler.matchWidthOrHeight = desk ? 1 : 0;
            cgo.AddComponent<GraphicRaycaster>();
            canvasRT = (RectTransform)cgo.transform;
            var bg = K.Rect("Hintergrund", canvasRT); K.Fill(bg); var bgi = bg.gameObject.AddComponent<RawImage>(); bgi.texture = K.Gradient(K.Hex("#13241c"), K.Bg); bgi.raycastTarget = false;

            root = K.Rect("Wurzel", canvasRT); K.Fill(root);
            RectTransform main = root;
            if (desk)
            {
                // Seitenleiste
                var side = K.Rect("Seitenleiste", root); side.anchorMin = new Vector2(0, 0); side.anchorMax = new Vector2(0, 1); side.pivot = new Vector2(0, .5f); side.sizeDelta = new Vector2(SideW, 0); side.anchoredPosition = Vector2.zero;
                side.gameObject.AddComponent<Image>().color = K.Side;
                var edge = K.Rect("Kante", side); edge.anchorMin = new Vector2(1, 0); edge.anchorMax = new Vector2(1, 1); edge.pivot = new Vector2(1, .5f); edge.sizeDelta = new Vector2(2, 0); edge.gameObject.AddComponent<Image>().color = K.Line;
                var sv = side.gameObject.AddComponent<VerticalLayoutGroup>(); sv.padding = new RectOffset(32, 32, 44, 32); sv.spacing = 10; sv.childControlWidth = true; sv.childControlHeight = true; sv.childForceExpandWidth = true; sv.childForceExpandHeight = false;
                var logo = K.VBox(side, -6); K.Head(logo, "Fußball-", 76, K.Txt); K.Head(logo, "Pyramide", 76, K.Acc);
                K.Label(side, "Kreisklasse bis Champions League", 24, K.Mut);
                K.Gap(side, 36);
                sideNav = K.VBox(side, 6);
                var spacer = K.Rect("Platz", side); K.LE(spacer, -1, -1, -1, 1);
                sideClub = K.VBox(side, 10);
                main = K.Rect("Hauptbereich", root); main.anchorMin = Vector2.zero; main.anchorMax = Vector2.one; main.offsetMin = new Vector2(SideW, 0); main.offsetMax = Vector2.zero;
                // Kopfzeile
                topBar = K.Rect("Kopf", main); topBar.anchorMin = new Vector2(0, 1); topBar.anchorMax = new Vector2(1, 1); topBar.pivot = new Vector2(.5f, 1); topBar.sizeDelta = new Vector2(0, TopH);
                var tbg = topBar.gameObject.AddComponent<RawImage>(); tbg.texture = K.Gradient(K.A(K.Side, .96f), K.A(K.Bg, .6f));
                var tl = K.Rect("Linie", topBar); tl.anchorMin = Vector2.zero; tl.anchorMax = new Vector2(1, 0); tl.pivot = new Vector2(.5f, 0); tl.sizeDelta = new Vector2(0, 2); tl.gameObject.AddComponent<Image>().color = K.Line;
                var th = topBar.gameObject.AddComponent<HorizontalLayoutGroup>(); th.padding = new RectOffset(56, 48, 20, 20); th.spacing = 24; th.childAlignment = TextAnchor.MiddleLeft;
                th.childControlWidth = true; th.childControlHeight = true; th.childForceExpandWidth = false; th.childForceExpandHeight = false;
                var tv = K.VBox(topBar, 2); K.LE(tv, -1, -1, 1);
                topTitle = K.Head(tv, "", 70); FitTitle(topTitle, 70);
                topSub = K.Label(tv, "", 30, K.Mut, TextAnchor.MiddleLeft, FontStyle.Normal, -1, false);
                topActions = K.HBox(topBar, 96, 18);
            }
            else
            {
                topBar = K.Rect("Kopf", root); topBar.anchorMin = new Vector2(0, 1); topBar.anchorMax = new Vector2(1, 1); topBar.pivot = new Vector2(.5f, 1); topBar.sizeDelta = new Vector2(0, TopH);
                var tbg = topBar.gameObject.AddComponent<RawImage>(); tbg.texture = K.Gradient(K.Side, K.A(K.Side, .92f));
                var tv = topBar.gameObject.AddComponent<VerticalLayoutGroup>(); tv.padding = new RectOffset(36, 36, 24, 18); tv.childControlHeight = true; tv.childControlWidth = true; tv.childForceExpandHeight = false; tv.spacing = 2;
                topTitle = K.Head(topBar, "Fußball-Pyramide", 60); FitTitle(topTitle, 60);
                topSub = K.Label(topBar, "", K.FSs - 2, K.Mut, TextAnchor.MiddleLeft, FontStyle.Normal, -1, false);
                navBar = K.Rect("Navigation", root); navBar.anchorMin = new Vector2(0, 0); navBar.anchorMax = new Vector2(1, 0); navBar.pivot = new Vector2(.5f, 0); navBar.sizeDelta = new Vector2(0, 150);
                navBar.gameObject.AddComponent<Image>().color = K.Side;
                var ln = K.Rect("Linie", navBar); K.Ignore(ln); ln.anchorMin = new Vector2(0, 1); ln.anchorMax = new Vector2(1, 1); ln.pivot = new Vector2(.5f, 1); ln.sizeDelta = new Vector2(0, 2); ln.gameObject.AddComponent<Image>().color = K.Line;
                var nh = navBar.gameObject.AddComponent<HorizontalLayoutGroup>(); nh.childControlWidth = true; nh.childControlHeight = true; nh.childForceExpandWidth = true; nh.childForceExpandHeight = true; nh.padding = new RectOffset(8, 8, 12, 12); nh.spacing = 6;
            }

            var sr = K.Rect("Inhalt", main); sr.anchorMin = Vector2.zero; sr.anchorMax = Vector2.one; sr.offsetMin = new Vector2(0, desk ? 0 : 150); sr.offsetMax = new Vector2(0, -TopH);
            sr.gameObject.AddComponent<Image>().color = new Color(0, 0, 0, 0);
            scroll = sr.gameObject.AddComponent<ScrollRect>(); scroll.horizontal = false; scroll.scrollSensitivity = desk ? 90 : 60; scroll.movementType = ScrollRect.MovementType.Clamped; scroll.decelerationRate = .12f; scroll.inertia = true;
            var vp = K.Rect("Viewport", sr); K.Fill(vp); vp.gameObject.AddComponent<RectMask2D>();
            content = K.Rect("Content", vp); content.anchorMin = new Vector2(0, 1); content.anchorMax = new Vector2(1, 1); content.pivot = new Vector2(.5f, 1); content.sizeDelta = Vector2.zero;
            var cv = content.gameObject.AddComponent<VerticalLayoutGroup>(); cv.padding = desk ? new RectOffset(56, 56, 44, 72) : new RectOffset(24, 24, 24, 48); cv.spacing = desk ? 28 : 20;
            cv.childControlWidth = true; cv.childControlHeight = true; cv.childForceExpandWidth = true; cv.childForceExpandHeight = false;
            content.gameObject.AddComponent<ContentSizeFitter>().verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            scroll.viewport = vp; scroll.content = content;
            lastScreen = Vector2.zero;
        }

        static void FitTitle(Text t, int max) { t.horizontalOverflow = HorizontalWrapMode.Wrap; t.verticalOverflow = VerticalWrapMode.Truncate; t.resizeTextForBestFit = true; t.resizeTextMinSize = 28; t.resizeTextMaxSize = max; K.LE(t, -1, max + 6); }

        void Update()
        {
            var scr = new Vector2(Screen.width, Screen.height);
            if (scr != lastScreen || Screen.safeArea != lastSafe)
            {
                if (built && IsDesk() != desk) { BuildShell(); lastTab = ""; Render(); }
                lastScreen = scr; lastSafe = Screen.safeArea;
                Canvas.ForceUpdateCanvases();
                if (!desk)
                {
                    // Notch und Gestenleiste auf dem Handy freihalten
                    float ch = canvasRT.rect.height; var sa = Screen.safeArea;
                    float top = (Screen.height - sa.yMax) / Mathf.Max(1, Screen.height) * ch, bot = sa.yMin / Mathf.Max(1, Screen.height) * ch;
                    root.offsetMin = new Vector2(0, bot); root.offsetMax = new Vector2(0, -top);
                }
            }
#if ENABLE_LEGACY_INPUT_MANAGER
            if (Input.GetKeyDown(KeyCode.Escape) && tab != "title" && G != null && G.S.fav >= 0 && tab != "home") Go("home");
            if (desk && G != null && G.S.fav >= 0 && Input.GetKeyDown(KeyCode.Space) && UnityEngine.EventSystems.EventSystem.current != null && !(UnityEngine.EventSystems.EventSystem.current.currentSelectedGameObject != null && UnityEngine.EventSystems.EventSystem.current.currentSelectedGameObject.GetComponent<InputField>() != null))
            { if (G.SeasonDone) DoEndSeason(); else DoNext(); }
#endif
        }

        void Go(string t) { tab = t; Render(); }
        void Save() { try { if (G != null) Store.Save(G.S); } catch (Exception e) { Debug.LogWarning("Speichern fehlgeschlagen: " + e.Message); } }
        void DoNext() { PlayToFavMatch(); Save(); Render(); }
        void DoSimEnd() { G.SimToEnd(); Save(); Render(); }
        void DoEndSeason() { G.EndSeason(); showAllLog = false; Save(); Go("season"); }

        void Render()
        {
            try { RenderInner(); }
            catch (Exception e)
            {
                Debug.LogException(e); K.Clear(content);
                var c = K.CardBox(content); K.Head(c, "Fehler", K.FSh, K.Down); K.Label(c, e.Message + "\n" + e.StackTrace, 26, K.Mut);
                K.Btn(c, "Zum Start", () => Go(G != null && G.S.fav >= 0 ? "home" : "title"));
            }
        }

        void RenderInner()
        {
            K.Clear(content); resultsBox = null;
            bool inGame = G != null && G.S.fav >= 0;
            if (desk) { BuildSide(inGame); BuildActions(inGame); }
            else
            {
                navBar.gameObject.SetActive(inGame);
                scroll.GetComponent<RectTransform>().offsetMin = new Vector2(0, inGame ? 150 : 0);
                if (inGame) BuildNav();
            }
            UpdateTop();
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
                case "cups": CupsTab(); break;
                case "cup": CupTab(); break;
                case "euro": EuroTab(); break;
            }
            if (tab != lastTab) { lastTab = tab; Canvas.ForceUpdateCanvases(); scroll.verticalNormalizedPosition = 1; }
        }

        string TabTitle()
        {
            switch (tab)
            {
                case "home": return "Übersicht"; case "table": return "Tabelle"; case "games": return "Spielplan"; case "squad": return "Kader";
                case "leagues": return "Ligen"; case "team": return "Verein"; case "season": return "Saison"; case "cups": return "Pokale";
                case "cup": return "Pokal"; case "euro": return "Europapokal"; case "pick": return "Verein wählen";
            }
            return "Fußball-Pyramide";
        }
        void UpdateTop()
        {
            if (G == null) { topTitle.text = desk ? "HAUPTMENÜ" : "FUSSBALL-PYRAMIDE"; topSub.text = "Die komplette deutsche Fußballpyramide"; return; }
            string st = "Saison " + Sl(G.S.season) + "  ·  " + (G.SeasonDone ? "Saison beendet" : "Spieltag " + G.S.day + " von " + G.MaxDay);
            if (desk) { topTitle.text = TabTitle().ToUpperInvariant(); topSub.text = (G.S.fav >= 0 ? G.T(G.S.fav).name + "  ·  " : "") + st; }
            else { topTitle.text = (G.S.fav >= 0 ? G.T(G.S.fav).name : "Fußball-Pyramide").ToUpperInvariant(); topSub.text = st; }
        }
        static string Sl(int s) { return s + "/" + ((s + 1) % 100).ToString("00"); }

        // Handy: Leiste unten
        void BuildNav()
        {
            K.Clear(navBar);
            foreach (var it in NavItems)
            {
                string key = it[0]; bool on = NavOn(key);
                var b = K.Btn(navBar, it[1] == "Übersicht" ? "Start" : it[1] == "Spielplan" ? "Spiele" : it[1], () => NavGo(key), on ? K.AccD : K.Side, -1, -1, 26, on ? Color.white : K.Mut);
                var le = b.GetComponent<LayoutElement>(); le.minHeight = 0; le.preferredHeight = -1; le.flexibleWidth = 1;
            }
        }
        bool NavOn(string key) { return tab == key || (key == "leagues" && tab == "team") || (key == "cups" && (tab == "cup" || tab == "euro")); }
        void NavGo(string key) { if (key == "table") viewLeague = null; if (key == "squad") viewTeam = -1; if (key == "games") { viewLeague = null; viewRound = -1; } Go(key); }

        // PC: Seitenleiste mit Navigation und Vereinskarte
        void BuildSide(bool inGame)
        {
            K.Clear(sideNav); K.Clear(sideClub);
            if (!inGame)
            {
                SideItem("Hauptmenü", tab == "title", () => Go("title"));
                if (G != null) SideItem("Verein wählen", tab == "pick" || tab == "team", () => Go("pick"));
                return;
            }
            foreach (var it in NavItems) { string key = it[0]; SideItem(it[1], NavOn(key), () => NavGo(key)); }
            var t = G.T(G.S.fav); var l = G.LeagueOf(G.S.fav);
            var cc = K.VBox(sideClub, 8, 20, K.Card);
            var hr = K.HBox(cc, 96, 16); K.Crest(hr, t, 84);
            var hv = K.VBox(hr, 0); K.LE(hv, -1, -1, 1);
            K.Cell(hv, t.name, -1, TextAnchor.MiddleLeft, K.Txt, FontStyle.Bold, 28).GetComponent<LayoutElement>().preferredHeight = 40;
            K.Cell(hv, l != null ? l.name : "", -1, TextAnchor.MiddleLeft, K.Mut, FontStyle.Normal, 24).GetComponent<LayoutElement>().preferredHeight = 34;
            var fav = G.S.fav; K.Click(hr, () => { viewTeam = fav; Go("team"); });
            K.Btn(sideClub, "Hauptmenü", () => { Save(); G = null; Go("title"); }, K.Card2, 76, -1, 28, K.Mut);
        }
        void SideItem(string label, bool on, Action act)
        {
            var r = K.HBox(sideNav, 84, 18, 22, on ? K.A(K.Acc, .14f) : (Color?)null);
            var bar = K.Rect("Markierung", r); K.Panel(bar, on ? K.Acc : new Color(0, 0, 0, 0), 3); K.LE(bar, 6, 44);
            K.Cell(r, label, -1, TextAnchor.MiddleLeft, on ? K.Txt : K.Mut, on ? FontStyle.Bold : FontStyle.Normal, 34);
            K.Click(r, act);
        }
        // PC: Aktionen in der Kopfzeile (Weiter, Bis Saisonende, Saison abschließen)
        void BuildActions(bool inGame)
        {
            K.Clear(topActions); if (!inGame) return;
            if (G.SeasonDone) { K.Btn(topActions, "Saison abschließen  ▶", DoEndSeason, K.Gold, 96, 520, 34, Color.black); return; }
            K.Btn(topActions, "Bis Saisonende", DoSimEnd, K.Card2, 96, 340, 32, K.Mut);
            K.Btn(topActions, "Weiter  ▶", DoNext, K.Acc, 96, 340, 36, Color.white);
        }

        // ---------- Start ohne Spiel ----------
        // Pyramide aus 12 Spielklassen als Blickfang (Startbildschirm)
        static readonly string[] PyrNames = { "Bundesliga", "2. Bundesliga", "3. Liga", "Regionalliga", "Oberliga", "Verbandsliga", "Landesliga", "Bezirksliga", "Kreisoberliga", "Kreisliga", "Kreisklasse", "C-Klasse" };
        static readonly string[] PyrCols = { "#f0c94a", "#d9c552", "#c2c25b", "#a8be63", "#8fba69", "#76b56f", "#5fb073", "#4baa76", "#3fa275", "#36946b", "#2e8661", "#287858" };
        void Pyramid(Transform p, float w, float bh)
        {
            var v = K.VBox(p, bh * .2f); v.GetComponent<VerticalLayoutGroup>().childAlignment = TextAnchor.UpperCenter; v.GetComponent<VerticalLayoutGroup>().childForceExpandWidth = false;
            for (int i = 0; i < PyrNames.Length; i++)
            {
                var r = K.Rect("Stufe", v); K.Panel(r, K.Hex(PyrCols[i]), 8); K.LE(r, w * (.34f + .66f * i / 11f), bh);
                var t = K.Head(r, PyrNames[i], (int)(bh * .56f), K.Hex("#06150d"), TextAnchor.MiddleCenter); K.Fill(t.rectTransform);
            }
        }
        void Title()
        {
            var cols = K.Columns(content, 64, 1.1f, 1);
            var left = K.VBox(cols[0], 24); left.GetComponent<VerticalLayoutGroup>().childAlignment = TextAnchor.UpperCenter;
            if (desk) K.Gap(left, 30);
            Pyramid(left, desk ? 1100 : 900, desk ? 64 : 48);
            var c = K.CardBox(cols[1], desk ? 56 : 44, 22);
            if (desk) K.Gap(c, 6);
            K.Head(c, "Fußball-Pyramide", desk ? 120 : 96, K.Txt, TextAnchor.MiddleCenter);
            K.Label(c, "Von der Kreisklasse bis zur Champions League – jede Liga, jeder Verein.", K.FS, K.Mut, TextAnchor.MiddleCenter);
            K.Gap(c, 16);
            if (Store.HasSave) K.Btn(c, "Spiel fortsetzen", ContinueGame, K.Acc, 130, -1, 44, Color.white);
            K.Btn(c, confirmNew ? "Wirklich neu beginnen? Spielstand wird ersetzt" : "Neues Spiel", () =>
            {
                if (Store.HasSave && !confirmNew) { confirmNew = true; Render(); return; }
                confirmNew = false; NewGame();
            }, Store.HasSave ? K.Card2 : K.Acc, 130, -1, 44, Color.white);
            if (error != null) K.Label(c, error, 28, K.Down);
            K.Gap(c, 10); K.Divider(c); K.Gap(c, 6);
            try
            {
                var w = Store.LoadWorld();
                var sr = K.HBox(c, -1, 18);
                K.Stat(sr, "Vereine", w.teams.Count.ToString("N0").Replace(',', '.'), K.Acc); K.Stat(sr, "Ligen", w.leagues.Count.ToString(), K.Acc); K.Stat(sr, "Wappen", Crests().ToString(), K.Acc);
            }
            catch (Exception e) { K.Label(c, "Daten fehlen: " + e.Message, K.FSs, K.Down); }
            K.Label(c, "Ligabetrieb mit Auf- und Abstieg in der ganzen Pyramide · DFB-, Landes- und Kreispokale · Europapokal", 28, K.Mut, TextAnchor.MiddleCenter);
        }
        static int Crests() { return Resources.LoadAll<Texture2D>("Crests").Length; }

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
            var c = K.CardBox(content);
            K.Head(c, "Wähle deinen Verein", K.Desk ? 76 : 60);
            K.Label(c, "Suche nach Name oder Ort – oder stöbere unter „Ligen“.", K.FSs, K.Mut);
            SearchField(c, "Verein suchen …", query, v => { query = v; FillResults(); });
            K.Btn(c, "Ligen durchsuchen", () => Go("leagues"));
            resultsBox = K.VBox(content, 10);
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
        }

        // ---------- Übersicht (Dashboard) ----------
        void Home()
        {
            int fav = G.S.fav; var t = G.T(fav); var l = G.LeagueOf(fav);
            var fx = G.FixturesOf(fav);
            var cols = K.Columns(content, 32, 1.45f, 1);
            var L = cols[0]; var R = cols[1];

            // Vereinskopf mit Kennzahlen
            var head = K.CardBox(L, 32, 18);
            var hr = K.HBox(head, desk ? 190 : 170, 32); K.Crest(hr, t, desk ? 176 : 150);
            var hv = K.VBox(hr, 4); K.LE(hv, -1, -1, 1);
            K.Kicker(hv, l != null ? l.name : "Ohne Liga");
            K.Head(hv, t.name, desk ? 84 : 62);
            if (l != null)
            {
                var tb = G.Table(l); int pos = tb.FindIndex(r => r.id == fav); var row = tb[pos];
                var sr = K.HBox(head, -1, 16);
                K.Stat(sr, "Platz", (pos + 1) + ".", pos == 0 ? K.Gold : K.Txt); K.Stat(sr, "Punkte", row.p.ToString()); K.Stat(sr, "Tore", row.tf + ":" + row.tg); K.Stat(sr, "Stärke", t.r.ToString("0.0"), K.Acc);
                var form = fx.Where(x => x.Value.hg >= 0).Select(x => { var m = x.Value; int me = m.h == fav ? m.hg : m.ag, op = m.h == fav ? m.ag : m.hg; return me > op ? 1 : me < op ? -1 : 0; }).ToList();
                if (form.Count > 0) { var fr = K.HBox(head, 60, 10); K.Label(fr, "FORM", 24, K.Mut, TextAnchor.MiddleLeft, FontStyle.Normal, 100); K.Form(fr, form.Skip(Math.Max(0, form.Count - 6)), 50); }
            }

            // Nächstes Spiel (groß)
            var next = fx.FirstOrDefault(x => x.Value.hg < 0);
            var cupNext = G.SeasonDone ? null : G.CupGamesOf(fav).FirstOrDefault(x => x.m.w < 0 && x.m.hg < 0 && x.day > G.S.day);
            int leagueDay = next.Value != null && l != null && next.Key < l.dates.Count ? l.dates[next.Key] : int.MaxValue;
            bool cupFirst = !G.SeasonDone && cupNext != null && cupNext.day <= leagueDay;
            var nc = K.AccentCard(L, cupFirst ? K.Gold : K.Acc, 32, 16);
            if (!G.SeasonDone && (cupFirst || next.Value != null))
            {
                int day = cupFirst ? cupNext.day : leagueDay;
                K.Kicker(nc, "Nächstes Spiel  ·  " + (cupFirst ? cupNext.comp + " · " + cupNext.round : (next.Key + 1) + ". Spieltag") + "  ·  Spieltag " + day, cupFirst ? K.Gold : K.Acc);
                int h = cupFirst ? cupNext.m.h : next.Value.h, a = cupFirst ? cupNext.m.a : next.Value.a;
                Duel(nc, h, a);
                var bh = K.HBox(nc, 120, 16);
                K.Btn(bh, "Weiter zum Spiel  ▶", DoNext, K.Acc, 120, -1, 40, Color.white);
                K.Btn(bh, "Bis Saisonende", DoSimEnd, K.Card2, 120, -1, 38, K.Mut);
            }
            else
            {
                K.Kicker(nc, "Saison beendet", K.Gold);
                K.Head(nc, "Die Saison ist zu Ende", 64);
                K.Btn(nc, "Saison abschließen  →  " + Sl(G.S.season + 1), DoEndSeason, K.Gold, 130, -1, 42, Color.black);
            }

            // Letzte Ergebnisse
            var done = fx.Where(x => x.Value.hg >= 0).Reverse().Take(desk ? 6 : 5).ToList();
            if (done.Count > 0)
            {
                var rc = K.CardBox(L, 24, 6); K.Kicker(rc, "Letzte Spiele");
                foreach (var x in done) MatchLine(rc, x.Value, false, fav);
            }
            // Tabellenausschnitt
            if (l != null)
            {
                var tc = K.CardBox(R, 22, 4); K.Kicker(tc, l.name);
                var tb = G.Table(l); int pos = tb.FindIndex(r => r.id == fav);
                int n = desk ? 9 : 7, a = Mathf.Clamp(pos - n / 2, 0, Mathf.Max(0, tb.Count - n)), b = Mathf.Min(tb.Count, a + n);
                for (int i = a; i < b; i++) TableRow(tc, l, tb, i, true);
                K.Btn(tc, "Ganze Tabelle", () => { viewLeague = l.id; Go("table"); }, K.Card2, 92, -1, 32);
            }
            // Pokale
            var cups = G.S.cups.Where(c => c.teams.Contains(fav)).ToList(); var euros = G.S.euro.Where(e => e.teams.Contains(fav)).ToList();
            if (cups.Count + euros.Count > 0)
            {
                var pc = K.CardBox(R, 22, 6); K.Kicker(pc, "Pokale");
                foreach (var c in cups) { var r = K.HBox(pc, 72, 12, 8); K.Cell(r, c.name, -1, TextAnchor.MiddleLeft, K.Txt, FontStyle.Normal, 30); K.Pill(r, G.CupReach(c, fav) ?? "–", c.winner == fav ? K.Gold : K.Acc, 24); var cid = c.id; K.Click(r, () => { viewCup = cid; viewCupRound = -1; Go("cup"); }); }
                foreach (var e in euros) { var r = K.HBox(pc, 72, 12, 8); K.Cell(r, e.name, -1, TextAnchor.MiddleLeft, K.Txt, FontStyle.Normal, 30); K.Pill(r, G.EuroReach(e, fav), e.winner == fav ? K.Gold : K.Blue, 24); var eid = e.id; K.Click(r, () => { viewEuro = eid; euroKo = e.step > e.nmd; Go("euro"); }); }
            }
            if (!desk) { var mc = K.CardBox(content); K.Btn(mc, "Zum Hauptmenü", () => { Save(); G = null; Go("title"); }, K.Card2, 100); }
        }
        // großes Duell: Wappen, Namen, „VS“
        void Duel(Transform p, int h, int a)
        {
            var r = K.HBox(p, desk ? 260 : 220, 20); r.GetComponent<HorizontalLayoutGroup>().childAlignment = TextAnchor.MiddleCenter;
            foreach (var id in new[] { h, -1, a })
            {
                if (id < 0) { var vs = K.VBox(r, 0); K.LE(vs, 140); K.Head(vs, "VS", 64, K.Mut, TextAnchor.MiddleCenter); K.Label(vs, "", 4); continue; }
                var v = K.VBox(r, 10); v.GetComponent<VerticalLayoutGroup>().childAlignment = TextAnchor.MiddleCenter; v.GetComponent<VerticalLayoutGroup>().childForceExpandWidth = false; K.LE(v, -1, -1, 1).minWidth = 0;
                var cw = K.HBox(v, desk ? 150 : 120, 0); cw.GetComponent<HorizontalLayoutGroup>().childAlignment = TextAnchor.MiddleCenter; K.Crest(cw, G.T(id), desk ? 150 : 120);
                var nm = K.Label(v, G.T(id).name, desk ? 36 : 32, id == G.S.fav ? K.Acc : K.Txt, TextAnchor.MiddleCenter, FontStyle.Bold);
                K.Label(v, (id == h ? "Heim" : "Gast") + " · Stärke " + G.T(id).r.ToString("0.0"), 24, K.Mut, TextAnchor.MiddleCenter);
            }
        }

        // spielt Spieltage, bis Mein Verein gespielt hat – in der Liga oder im Pokal (kleine Ligen spielen nicht an jedem Spieltag)
        void PlayToFavMatch()
        {
            int fav = G.S.fav; var l = G.LeagueOf(fav); int before = l != null ? l.played : 0; int g = 0;
            int cupDay = G.NextCupDay(fav);
            while (!G.SeasonDone && g++ < 100)
            {
                G.NextDay();
                if (l != null && l.played != before) break;
                if (cupDay > 0 && G.S.day >= cupDay) break;
            }
        }

        void MatchLine(Transform p, Match m, bool big, int fav = -1)
        {
            var r = K.HBox(p, big ? 130 : 90, 14);
            var h = G.T(m.h); var a = G.T(m.a);
            var hn = K.Cell(r, h.name, -1, TextAnchor.MiddleRight, m.h == fav ? K.Acc : K.Txt, m.h == G.S.fav ? FontStyle.Bold : FontStyle.Normal, big ? 36 : 32);
            K.Crest(r, h, big ? 90 : 60);
            string sc = m.hg >= 0 ? m.hg + " : " + m.ag : "– : –";
            Color col = K.Txt;
            if (fav >= 0 && m.hg >= 0) { int me = m.h == fav ? m.hg : m.ag, op = m.h == fav ? m.ag : m.hg; col = me > op ? K.Up : me < op ? K.Down : K.Rel; }
            var box = K.Rect("Ergebnis", r); K.Panel(box, m.hg >= 0 ? K.Card3 : K.Card2, 10); K.LE(box, big ? 170 : 130, big ? 96 : 66);
            var st = K.Head(box, sc, big ? 58 : 42, col, TextAnchor.MiddleCenter); K.Fill(st.rectTransform);
            K.Crest(r, a, big ? 90 : 60);
            K.Cell(r, a.name, -1, TextAnchor.MiddleLeft, m.a == fav ? K.Acc : K.Txt, m.a == G.S.fav ? FontStyle.Bold : FontStyle.Normal, big ? 36 : 32);
        }

        void TeamLine(Transform p, int id, Action on)
        {
            var t = G.T(id); var l = G.LeagueOf(id);
            var r = K.HBox(p, 120, 20, 20, K.Card2);
            K.Crest(r, t, 84);
            var v = K.VBox(r, 2); K.LE(v, -1, -1, 1);
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
            LeagueHead(l);
            var cols = K.Columns(content, 32, 2.6f, 1);
            var tb = G.Table(l);
            var c = K.CardBox(cols[0], 16, 0);
            var h = K.HBox(c, 64, 10, 8);
            K.Cell(h, "", 8); K.Cell(h, "#", 48, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 26); K.Cell(h, "", 56, TextAnchor.MiddleCenter);
            K.Cell(h, "VEREIN", -1, TextAnchor.MiddleLeft, K.Mut, FontStyle.Normal, 26);
            K.Cell(h, "SP", 64, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 26);
            if (desk) { K.Cell(h, "S", 60, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 26); K.Cell(h, "U", 60, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 26); K.Cell(h, "N", 60, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 26); K.Cell(h, "TORE", 120, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 26); }
            K.Cell(h, "DIFF", 84, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 26); K.Cell(h, "PKT", 84, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 26);
            K.Divider(c);
            for (int i = 0; i < tb.Count; i++) TableRow(c, l, tb, i);
            var lg = K.HBox(cols[0], 60, 24);
            Legend(lg, K.Up, "Aufstieg"); Legend(lg, K.Rel, "Relegation"); Legend(lg, K.Down, "Abstieg");
            var bh = K.HBox(cols[1], 110, 16);
            K.Btn(bh, "Spielplan", () => { viewRound = -1; Go("games"); });
            LeagueLinks(l, cols[1]);
        }
        void Legend(Transform p, Color c, string s) { var b = K.Rect("Farbe", p); K.Panel(b, c, 4); K.LE(b, 24, 24); K.Cell(p, s, 220, TextAnchor.MiddleLeft, K.Mut, FontStyle.Normal, 28); }

        void TableRow(Transform p, League l, List<Row> tbl, int i, bool compact = false)
        {
            var row = tbl[i]; var t = G.T(row.id); bool me = row.id == G.S.fav; bool wide = desk && !compact;
            var r = K.HBox(p, compact ? 76 : 84, 10, 8, me ? K.A(K.Acc, .14f) : (Color?)null);
            int z = G.Zone(l, i, tbl.Count);
            var bar = K.Rect("Zone", r); K.Panel(bar, z == 1 ? K.Up : z == 2 || z == -2 ? K.Rel : z == -1 ? K.Down : new Color(0, 0, 0, 0), 3); K.LE(bar, 8, 56);
            K.Cell(r, (i + 1).ToString(), 48, TextAnchor.MiddleCenter, me ? K.Acc : K.Mut, FontStyle.Bold, 30);
            K.Crest(r, t, 56);
            K.Cell(r, t.name, -1, TextAnchor.MiddleLeft, me ? K.Acc : K.Txt, me ? FontStyle.Bold : FontStyle.Normal, 34);
            K.Cell(r, row.sp.ToString(), 64, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 32);
            if (wide) { K.Cell(r, row.s.ToString(), 60, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 32); K.Cell(r, row.u.ToString(), 60, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 32); K.Cell(r, row.n.ToString(), 60, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 32); K.Cell(r, row.tf + ":" + row.tg, 120, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 32); }
            K.Cell(r, (row.Diff > 0 ? "+" : "") + row.Diff, 84, TextAnchor.MiddleCenter, row.Diff > 0 ? K.Up : row.Diff < 0 ? K.Down : K.Mut, FontStyle.Normal, 32);
            var pt = K.Cell(r, row.p.ToString(), 84, TextAnchor.MiddleCenter, K.Txt, FontStyle.Bold, 36); pt.font = K.FH; pt.fontSize = 44;
            int id = row.id; K.Click(r, () => { viewTeam = id; Go("team"); });
        }

        void LeagueHead(League l)
        {
            var c = K.AccentCard(content, K.Acc, 30, 6);
            string vb; string info = l.foreign ? "Ausland" : "Stufe " + l.level + (l.vb != "" && VB.TryGetValue(l.vb, out vb) ? " · " + vb : "") + (l.kreis != "" ? " · Kreis " + l.kreis : "");
            K.Kicker(c, info);
            K.Head(c, l.name, desk ? 84 : 64);
            K.Label(c, l.teams.Count + " Vereine · " + l.played + " von " + l.rounds.Count + " Spieltagen gespielt", K.FSs - 2, K.Mut);
        }

        void LeagueLinks(League l, Transform where = null)
        {
            if (l.foreign) return;
            var c = K.CardBox(where ?? content, 24, 10);
            League up = null;
            if (l.level == 2) up = G.L("bl"); else if (l.level == 3) up = G.L("bl2"); else if (l.level == 4) up = G.L("l3");
            else if (l.level == 5) up = G.L(G.RegionOf(l.vb));
            else if (l.level > 5) up = G.LeagueByName(l.up) ?? G.S.leagues.FirstOrDefault(u => !u.foreign && u.level == l.level - 1 && u.vbs.Contains(l.vb));
            if (up != null) { K.Kicker(c, "Nächsthöhere Liga"); var lid = up.id; K.Btn(c, "▲  " + up.name, () => { viewLeague = lid; Go("table"); }, K.Card2, 96, -1, 34); }
            List<League> subs;
            if (l.level == 1) subs = new List<League> { G.L("bl2") };
            else if (l.level == 2) subs = new List<League> { G.L("l3") };
            else if (l.level == 3) subs = Game.RegionalLeagues.Select(x => G.L(x)).ToList();
            else if (l.level == 4) subs = G.S.leagues.Where(x => !x.foreign && x.level == 5 && G.RegionOf(x.vb) == l.id).ToList();
            else subs = G.S.leagues.Where(x => !x.foreign && x.level == l.level + 1 && x.up == l.name).ToList();
            if (subs.Count > 0)
            {
                K.Kicker(c, "Unterbau");
                foreach (var s in subs.Where(x => x != null)) { var sid = s.id; K.Btn(c, "▼  " + s.name, () => { viewLeague = sid; Go("table"); }, K.Card2, 96, -1, 34); }
            }
        }

        // ---------- Spielplan ----------
        void Games()
        {
            var l = CurLeague(); viewLeague = l.id;
            if (viewRound < 0) viewRound = Mathf.Clamp(l.played > 0 && (l.played >= l.rounds.Count || G.S.fav < 0 || G.LeagueOf(G.S.fav) != l) ? l.played - 1 : l.played, 0, l.rounds.Count - 1);
            LeagueHead(l);
            var nav = K.HBox(content, 110, 16);
            K.Btn(nav, "◀", () => { viewRound = Mathf.Max(0, viewRound - 1); Render(); }, K.Card2, 110, 140, 44);
            K.Cell(nav, (viewRound + 1) + ". Spieltag von " + l.rounds.Count, -1, TextAnchor.MiddleCenter, K.Txt, FontStyle.Bold, 38);
            K.Btn(nav, "▶", () => { viewRound = Mathf.Min(l.rounds.Count - 1, viewRound + 1); Render(); }, K.Card2, 110, 140, 44);
            var gc = K.Columns(content, 32, 1.3f, 1);
            var c = K.CardBox(gc[0], 16, 6); K.Kicker(c, (viewRound + 1) + ". Spieltag" + (viewRound < l.dates.Count ? "  ·  Saison-Spieltag " + l.dates[viewRound] : ""));
            foreach (var m in l.rounds[viewRound].m) MatchLine(c, m, false, -1);
            int spielfrei = l.teams.Count % 2 == 1 ? l.teams.FirstOr(id => !l.rounds[viewRound].m.Any(m => m.h == id || m.a == id), -1) : -1;
            if (spielfrei >= 0) K.Label(c, "Spielfrei: " + G.T(spielfrei).name, 28, K.Mut);
            if (G.S.fav >= 0 && G.LeagueOf(G.S.fav) == l)
            {
                var fc = K.CardBox(gc[1], 16, 6); K.Kicker(fc, "Spiele von " + G.T(G.S.fav).name);
                foreach (var x in G.FixturesOf(G.S.fav)) MatchLine(fc, x.Value, false, G.S.fav);
            }
        }

        // ---------- Kader ----------
        void SquadTab()
        {
            int id = viewTeam >= 0 ? viewTeam : G.S.fav; var t = G.T(id);
            var sq = G.Squad(id);
            var c = K.CardBox(content, 28, 14);
            var hr = K.HBox(c, 140, 28); K.Crest(hr, t, 130);
            var hv = K.VBox(hr, 2); K.LE(hv, -1, -1, 1);
            K.Kicker(hv, G.LeagueOf(id) != null ? G.LeagueOf(id).name : "Kader");
            K.Head(hv, t.name, desk ? 76 : 58);
            var pl = sq.Select(x => G.S.players[x]).ToList();
            var sr = K.HBox(c, -1, 16);
            K.Stat(sr, "Spieler", sq.Count.ToString()); K.Stat(sr, "Stärke", t.r.ToString("0.0"), K.Acc);
            if (pl.Count > 0) { K.Stat(sr, "Ø Alter", pl.Average(x => x.a).ToString("0.0")); K.Stat(sr, "Kaderwert", Util.Money(pl.Sum(x => (double)G.PlayerValue(x)))); }
            var names = new Dictionary<string, string> { { "TW", "Torwart" }, { "AB", "Abwehr" }, { "MF", "Mittelfeld" }, { "ST", "Sturm" } };
            var cols = K.Columns(content, 32, 1, 1); int ci = 0;
            foreach (var pos in Game.Pos)
            {
                var ps = pl.Where(x => x.p == pos).OrderByDescending(x => x.s).ToList(); if (ps.Count == 0) continue;
                var pc = K.CardBox(cols[ci++ % 2], 18, 2);
                K.Kicker(pc, names[pos] + "  ·  " + ps.Count);
                foreach (var p in ps)
                {
                    var r = K.HBox(pc, 80, 12, 8);
                    K.Cell(r, p.no > 0 ? p.no.ToString() : "", 60, TextAnchor.MiddleCenter, K.Mut, FontStyle.Bold, 30);
                    K.Cell(r, p.n, -1, TextAnchor.MiddleLeft, K.Txt, FontStyle.Normal, 33);
                    K.Cell(r, Short(p.nat), 86, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 26);
                    K.Cell(r, p.a + " J.", 84, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 28);
                    var sb = K.Rect("Staerke", r); K.Panel(sb, K.A(p.s >= 80 ? K.Gold : p.s >= 65 ? K.Acc : p.s >= 45 ? K.Blue : K.Mut, .2f), 10); K.LE(sb, 82, 54);
                    var st = K.Head(sb, p.s.ToString("0"), 40, p.s >= 80 ? K.Gold : p.s >= 65 ? K.AccL : p.s >= 45 ? K.Blue : K.Mut, TextAnchor.MiddleCenter); K.Fill(st.rectTransform);
                    K.Cell(r, Util.Money(G.PlayerValue(p)), 190, TextAnchor.MiddleRight, K.Mut, FontStyle.Normal, 26);
                }
            }
            K.Label(content, "Spalten: Nummer · Name · Nation · Alter · Stärke · Marktwert", 26, K.Mut, TextAnchor.MiddleCenter);
        }
        static string Short(string nat) { if (string.IsNullOrEmpty(nat)) return ""; if (nat.StartsWith("X:")) return nat.Substring(2, Math.Min(3, nat.Length - 2)).ToUpperInvariant(); return nat == "DE" ? "GER" : nat; }

        // ---------- Ligen ----------
        void Leagues()
        {
            if (vbView != null)
            {
                string vbn; VB.TryGetValue(vbView, out vbn);
                var hc = K.CardBox(content, 24, 8); K.Head(hc, vbn ?? vbView, K.Desk ? 76 : 60);
                K.Btn(hc, "◀  Alle Verbände", () => { vbView = null; Render(); }, K.Card2, 96);
                var lcols = K.Columns(content, 28, 1, 1, 1); int li = 0;
                foreach (var g in G.S.leagues.Where(l => !l.foreign && l.level >= 5 && (l.vb == vbView || l.vbs.Contains(vbView))).GroupBy(l => l.level).OrderBy(x => x.Key))
                {
                    var c = K.CardBox(lcols[li++ % lcols.Length], 20, 8); K.Kicker(c, "Stufe " + g.Key + " · " + LevelName(g.First()));
                    foreach (var l in g.OrderBy(x => x.name)) { var lid = l.id; K.Btn(c, l.name + "  (" + l.teams.Count + ")", () => { viewLeague = lid; Go("table"); }, K.Card2, 92, -1, 32); }
                }
                return;
            }
            var top = K.Columns(content, 28, 1, 2);
            var pc = K.CardBox(top[0], 20, 8); K.Kicker(pc, "Profiligen");
            foreach (var id in Game.ProLeagues) { var l = G.L(id); if (l == null) continue; K.Btn(pc, l.name, () => { viewLeague = id; Go("table"); }, K.Card2, 92, -1, 34); }
            var vc = K.CardBox(top[1], 20, 8); K.Kicker(vc, "Landesverbände (ab Oberliga abwärts)");
            var vcols = K.Columns(vc, 14, 1, 1); int vi = 0;
            foreach (var kv in VB.OrderBy(x => x.Value))
            {
                string code = kv.Key; int n = G.S.leagues.Count(l => !l.foreign && l.level >= 5 && (l.vb == code || l.vbs.Contains(code))); if (n == 0) continue;
                K.Btn(vcols[vi++ % vcols.Length], kv.Value + "  ·  " + n + " Ligen", () => { vbView = code; Render(); }, K.Card2, 92, -1, 32);
            }
            var fc = K.CardBox(top[0], 20, 8); K.Kicker(fc, "Ausland");
            foreach (var l in G.S.leagues.Where(x => x.foreign)) { var lid = l.id; K.Btn(fc, l.name, () => { viewLeague = lid; Go("table"); }, K.Card2, 92, -1, 34); }
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
            var tc = K.Columns(content, 32, 1.2f, 1);
            var c = K.CardBox(tc[0], 32, 14);
            var hr = K.HBox(c, desk ? 200 : 180, 32); K.Crest(hr, t, desk ? 190 : 160);
            var hv = K.VBox(hr, 4); K.LE(hv, -1, -1, 1);
            K.Kicker(hv, l != null ? l.name : "Ohne Liga");
            K.Head(hv, t.name, desk ? 84 : 62);
            if (l != null)
            {
                var tb = G.Table(l); int pos = tb.FindIndex(r => r.id == id);
                var sr = K.HBox(c, -1, 16); K.Stat(sr, "Platz", (pos + 1) + ".", pos == 0 ? K.Gold : K.Txt); K.Stat(sr, "Punkte", tb[pos].p.ToString()); K.Stat(sr, "Stärke", t.r.ToString("0.0"), K.Acc);
            }
            if (G.S.fav < 0)
            {
                K.Btn(c, "Diesen Verein übernehmen", () => { G.S.fav = id; viewTeam = -1; viewLeague = null; Save(); Go("home"); }, K.Acc, 130, -1, 42, Color.white);
                K.Btn(c, "◀  Zurück zur Suche", () => Go("pick"), K.Card2, 100);
            }
            var bh = K.HBox(c, 110, 16);
            K.Btn(bh, "Kader", () => { viewTeam = id; Go("squad"); });
            if (l != null) { var lid = l.id; K.Btn(bh, "Tabelle", () => { viewLeague = lid; Go("table"); }); }
            TitlesCard(id, tc[0]);
            CupRunsCard(id, tc[0]);
            var fx = G.FixturesOf(id);
            if (fx.Count > 0)
            {
                var fc = K.CardBox(tc[1], 16, 6); K.Kicker(fc, "Spiele");
                foreach (var x in fx) MatchLine(fc, x.Value, false, id);
            }
        }

        // ---------- Saison ----------
        void SeasonTab()
        {
            int fav = G.S.fav; var h = G.S.hist.FirstOrDefault(x => x.team == fav);
            var sc = K.Columns(content, 32, 1, 1.3f);
            var c = K.CardBox(sc[0], 24, 6); K.Head(c, "Vereinsgeschichte", K.Desk ? 76 : 60);
            if (h == null || h.e.Count == 0) K.Label(c, "Noch keine Saison abgeschlossen.", K.FSs, K.Mut);
            else foreach (var e in h.e)
                {
                    var r = K.HBox(c, 76, 12);
                    K.Cell(r, Sl(e.season), 150, TextAnchor.MiddleLeft, K.Mut, FontStyle.Normal, 32);
                    K.Cell(r, e.league, -1, TextAnchor.MiddleLeft, K.Txt, FontStyle.Normal, 32);
                    K.Cell(r, e.pos + ". / " + e.n, 140, TextAnchor.MiddleRight, e.pos == 1 ? K.Gold : K.Txt, FontStyle.Bold, 32);
                }
            TitlesCard(fav, sc[0]);
            if (G.S.log.Count == 0) return;
            var lg = G.S.log[0]; string fn = G.T(fav).name;
            var lc = K.CardBox(sc[1], 24, 6); K.Kicker(lc, "Saison " + Sl(lg.season) + " – Meldungen");
            var mine = lg.lines.Where(x => x.Contains(fn)).ToList();
            foreach (var x in mine) K.Label(lc, "★ " + x, 32, K.Gold);
            var lines = showAllLog ? lg.lines.Take(400).ToList() : lg.lines.Where(x => !x.Contains(fn)).Take(25).ToList();
            foreach (var x in lines) K.Label(lc, x, 30, K.Txt);
            if (!showAllLog && lg.lines.Count > 25) K.Btn(lc, "Mehr anzeigen (" + lg.lines.Count + " Meldungen)", () => { showAllLog = true; Render(); }, K.Card2, 96);
        }
    }
}
