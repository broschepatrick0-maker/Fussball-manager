// Oberfläche: Start, Tabelle, Spielplan, Kader, Ligen, Saison – Hochformat fürs Handy, am PC mittig. Pokale siehe AppCups.cs.
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
        RectTransform column, topBar, navBar, content, resultsBox;
        ScrollRect scroll; CanvasScaler scaler; RectTransform canvasRT;
        Text topTitle, topSub;
        string tab = "title"; string lastTab = "";
        int viewTeam = -1; string viewLeague; int viewRound = -1; string vbView; string query = "";
        bool showAllLog; bool confirmNew; string error;
        Vector2 lastScreen; Rect lastSafe;

        static readonly Dictionary<string, string> VB = new Dictionary<string, string> {
            {"BY","Bayern"},{"BA","Baden"},{"SB","Südbaden"},{"WU","Württemberg"},{"HE","Hessen"},{"SW","Südwest"},{"RL","Rheinland"},{"SL","Saarland"},
            {"MR","Mittelrhein"},{"NR","Niederrhein"},{"WF","Westfalen"},{"NI","Niedersachsen"},{"HB","Bremen"},{"HH","Hamburg"},{"SH","Schleswig-Holstein"},
            {"MV","Mecklenburg-Vorpommern"},{"BB","Brandenburg"},{"BE","Berlin"},{"ST","Sachsen-Anhalt"},{"SN","Sachsen"},{"TH","Thüringen"} };

        // ---------- Gerüst ----------
        void Start()
        {
            K.Init();
            BuildShell();
            Render();
        }

        void BuildShell()
        {
            var cgo = new GameObject("Canvas", typeof(RectTransform));
            cgo.transform.SetParent(transform, false);
            var canvas = cgo.AddComponent<Canvas>(); canvas.renderMode = RenderMode.ScreenSpaceOverlay; canvas.pixelPerfect = false;
            scaler = cgo.AddComponent<CanvasScaler>(); scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize; scaler.referenceResolution = new Vector2(1080, 1920);
            cgo.AddComponent<GraphicRaycaster>();
            canvasRT = (RectTransform)cgo.transform;
            var bg = K.Rect("Hintergrund", canvasRT); K.Fill(bg); bg.gameObject.AddComponent<Image>().color = K.Bg;

            column = K.Rect("Spalte", canvasRT); column.anchorMin = new Vector2(.5f, 0); column.anchorMax = new Vector2(.5f, 1); column.pivot = new Vector2(.5f, .5f);
            column.sizeDelta = new Vector2(1080, 0);

            topBar = K.Rect("Kopf", column); topBar.anchorMin = new Vector2(0, 1); topBar.anchorMax = new Vector2(1, 1); topBar.pivot = new Vector2(.5f, 1); topBar.sizeDelta = new Vector2(0, 170);
            topBar.gameObject.AddComponent<Image>().color = K.Card;
            var tv = topBar.gameObject.AddComponent<VerticalLayoutGroup>(); tv.padding = new RectOffset(36, 36, 22, 18); tv.childControlHeight = true; tv.childControlWidth = true; tv.childForceExpandHeight = false; tv.spacing = 4;
            topTitle = K.Label(topBar, "FUSSBALL-PYRAMIDE", 50, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold, -1, false);
            topSub = K.Label(topBar, "", K.FSs, K.Mut, TextAnchor.MiddleLeft, FontStyle.Normal, -1, false);

            navBar = K.Rect("Navigation", column); navBar.anchorMin = new Vector2(0, 0); navBar.anchorMax = new Vector2(1, 0); navBar.pivot = new Vector2(.5f, 0); navBar.sizeDelta = new Vector2(0, 150);
            navBar.gameObject.AddComponent<Image>().color = K.Card;
            var nh = navBar.gameObject.AddComponent<HorizontalLayoutGroup>(); nh.childControlWidth = true; nh.childControlHeight = true; nh.childForceExpandWidth = true; nh.childForceExpandHeight = true; nh.padding = new RectOffset(8, 8, 10, 10); nh.spacing = 8;

            var sr = K.Rect("Inhalt", column); sr.anchorMin = Vector2.zero; sr.anchorMax = Vector2.one; sr.offsetMin = new Vector2(0, 150); sr.offsetMax = new Vector2(0, -170);
            sr.gameObject.AddComponent<Image>().color = new Color(0, 0, 0, 0);
            scroll = sr.gameObject.AddComponent<ScrollRect>(); scroll.horizontal = false; scroll.scrollSensitivity = 60; scroll.movementType = ScrollRect.MovementType.Clamped; scroll.decelerationRate = .12f;
            var vp = K.Rect("Viewport", sr); K.Fill(vp); vp.gameObject.AddComponent<RectMask2D>();
            content = K.Rect("Content", vp); content.anchorMin = new Vector2(0, 1); content.anchorMax = new Vector2(1, 1); content.pivot = new Vector2(.5f, 1); content.sizeDelta = Vector2.zero;
            var cv = content.gameObject.AddComponent<VerticalLayoutGroup>(); cv.padding = new RectOffset(24, 24, 24, 48); cv.spacing = 20;
            cv.childControlWidth = true; cv.childControlHeight = true; cv.childForceExpandWidth = true; cv.childForceExpandHeight = false;
            content.gameObject.AddComponent<ContentSizeFitter>().verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            scroll.viewport = vp; scroll.content = content;
        }

        void Update()
        {
            // Hochformat: Breite zählt; Querformat (PC): Höhe zählt und die Spalte bleibt handybreit in der Mitte
            var scr = new Vector2(Screen.width, Screen.height);
            if (scr != lastScreen || Screen.safeArea != lastSafe)
            {
                lastScreen = scr; lastSafe = Screen.safeArea;
                bool land = Screen.width > Screen.height;
                scaler.matchWidthOrHeight = land ? 1 : 0;
                Canvas.ForceUpdateCanvases();
                float cw = canvasRT.rect.width, ch = canvasRT.rect.height;
                column.sizeDelta = new Vector2(Mathf.Min(cw, land ? 1200 : cw), 0);
                var sa = Screen.safeArea; float top = (Screen.height - sa.yMax) / Mathf.Max(1, Screen.height) * ch, bot = sa.yMin / Mathf.Max(1, Screen.height) * ch;
                column.offsetMin = new Vector2(column.offsetMin.x, bot); column.offsetMax = new Vector2(column.offsetMax.x, -top);
            }
#if ENABLE_LEGACY_INPUT_MANAGER
            if (Input.GetKeyDown(KeyCode.Escape) && tab != "title" && G != null && G.S.fav >= 0 && tab != "home") Go("home");
#endif
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
            navBar.gameObject.SetActive(inGame);
            scroll.GetComponent<RectTransform>().offsetMin = new Vector2(0, inGame ? 150 : 0);
            if (inGame) BuildNav();
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

        void UpdateTop()
        {
            if (G == null) { topTitle.text = "FUSSBALL-PYRAMIDE"; topSub.text = "Die komplette deutsche Fußballpyramide"; return; }
            topTitle.text = G.S.fav >= 0 ? G.T(G.S.fav).name : "FUSSBALL-PYRAMIDE";
            string s = Sl(G.S.season);
            topSub.text = "Saison " + s + " · " + (G.SeasonDone ? "Saison beendet" : "Spieltag " + G.S.day + " von " + G.MaxDay);
        }
        static string Sl(int s) { return s + "/" + ((s + 1) % 100).ToString("00"); }

        void BuildNav()
        {
            K.Clear(navBar);
            var items = new[] { new[] { "home", "Start" }, new[] { "table", "Tabelle" }, new[] { "games", "Spiele" }, new[] { "squad", "Kader" }, new[] { "cups", "Pokale" }, new[] { "leagues", "Ligen" }, new[] { "season", "Saison" } };
            foreach (var it in items)
            {
                string key = it[0]; bool on = tab == key || (key == "leagues" && tab == "team") || (key == "cups" && (tab == "cup" || tab == "euro"));
                var b = K.Btn(navBar, it[1], () => { if (key == "table") { viewLeague = null; } if (key == "squad") viewTeam = -1; if (key == "games") { viewLeague = null; viewRound = -1; } Go(key); },
                    on ? K.AccD : K.Card, -1, -1, 28, on ? Color.white : K.Mut);
                var le = b.GetComponent<LayoutElement>(); le.minHeight = 0; le.preferredHeight = -1; le.flexibleWidth = 1;
            }
        }

        // ---------- Start ohne Spiel ----------
        void Title()
        {
            var c = K.CardBox(content, 48, 24);
            K.Label(c, "FUSSBALL-PYRAMIDE", 72, K.Txt, TextAnchor.MiddleCenter, FontStyle.Bold);
            K.Label(c, "Von der Kreisklasse bis zur Bundesliga – jede Liga, jeder Verein.", K.FS, K.Mut, TextAnchor.MiddleCenter);
            K.Gap(c, 12);
            if (Store.HasSave) K.Btn(c, "Spiel fortsetzen", ContinueGame, K.Acc, 130, -1, 44, Color.white);
            K.Btn(c, confirmNew ? "Wirklich neu beginnen? Spielstand wird ersetzt" : "Neues Spiel", () =>
            {
                if (Store.HasSave && !confirmNew) { confirmNew = true; Render(); return; }
                confirmNew = false; NewGame();
            }, Store.HasSave ? K.Card2 : K.Acc, 130, -1, 44, Color.white);
            if (error != null) K.Label(c, error, 28, K.Down);
            var info = K.CardBox(content);
            try
            {
                if (G == null) { var w = Store.LoadWorld(); K.Label(info, w.teams.Count.ToString("N0").Replace(',', '.') + " Vereine · " + w.leagues.Count + " Ligen · " + Crests() + " Wappen", K.FSs, K.Mut, TextAnchor.MiddleCenter); }
            }
            catch (Exception e) { K.Label(info, "Daten fehlen: " + e.Message, K.FSs, K.Down); }
            K.Label(info, "Unity-Version · Ligabetrieb mit Auf- und Abstieg in der ganzen Pyramide, DFB-, Landes- und Kreispokale, Europapokal", 28, K.Mut, TextAnchor.MiddleCenter);
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
            K.Label(c, "Wähle deinen Verein", K.FSh, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold);
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

        // ---------- Übersicht ----------
        void Home()
        {
            int fav = G.S.fav; var t = G.T(fav); var l = G.LeagueOf(fav);
            var head = K.CardBox(content, 28, 10);
            var hr = K.HBox(head, 170, 28); K.Crest(hr, t, 150);
            var hv = K.VBox(hr, 4); K.LE(hv, -1, -1, 1);
            K.Label(hv, t.name, 46, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold);
            if (l != null)
            {
                var tb = G.Table(l); int pos = tb.FindIndex(r => r.id == fav);
                K.Label(hv, l.name, K.FSs, K.Acc);
                K.Label(hv, "Platz " + (pos + 1) + " von " + tb.Count + " · " + tb[pos].p + " Punkte · Stärke " + t.r.ToString("0.0"), K.FSs, K.Mut);
            }

            // Nächstes Spiel
            var fx = G.FixturesOf(fav);
            var next = fx.FirstOrDefault(x => x.Value.hg < 0);
            var nc = K.CardBox(content);
            var cupNext = G.SeasonDone ? null : G.CupGamesOf(fav).FirstOrDefault(x => x.m.w < 0 && x.m.hg < 0 && x.day > G.S.day);
            var l0 = G.LeagueOf(fav); int leagueDay = next.Value != null && l0 != null && next.Key < l0.dates.Count ? l0.dates[next.Key] : int.MaxValue;
            if (!G.SeasonDone && cupNext != null && cupNext.day <= leagueDay)
            {
                K.Label(nc, "Nächstes Spiel · " + cupNext.comp + " · " + cupNext.round, K.FSs, K.Gold);
                CupLine(nc, cupNext.m, true, fav);
                var bh = K.HBox(nc, 120, 16);
                K.Btn(bh, "Nächstes Spiel", () => { PlayToFavMatch(); Save(); Render(); }, K.Acc, 120, -1, 40, Color.white);
                K.Btn(bh, "Bis Saisonende", () => { G.SimToEnd(); Save(); Render(); }, K.Card2, 120, -1, 40);
            }
            else if (!G.SeasonDone && next.Value != null)
            {
                K.Label(nc, "Nächstes Spiel · " + (next.Key + 1) + ". Spieltag", K.FSs, K.Mut);
                MatchLine(nc, next.Value, true);
                var bh = K.HBox(nc, 120, 16);
                K.Btn(bh, "Nächstes Spiel", () => { PlayToFavMatch(); Save(); Render(); }, K.Acc, 120, -1, 40, Color.white);
                K.Btn(bh, "Bis Saisonende", () => { G.SimToEnd(); Save(); Render(); }, K.Card2, 120, -1, 40);
            }
            else
            {
                K.Label(nc, "Die Saison ist zu Ende.", K.FS, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold);
                K.Btn(nc, "Saison abschließen → " + Sl(G.S.season + 1), () => { G.EndSeason(); showAllLog = false; Save(); Go("season"); }, K.Gold, 130, -1, 42, Color.black);
            }

            // Letzte Ergebnisse
            var done = fx.Where(x => x.Value.hg >= 0).Reverse().Take(5).ToList();
            if (done.Count > 0)
            {
                var rc = K.CardBox(content); K.Label(rc, "Letzte Spiele", K.FSs, K.Mut);
                foreach (var x in done) MatchLine(rc, x.Value, false, fav);
            }
            // Tabellenausschnitt
            if (l != null)
            {
                var tc = K.CardBox(content, 20, 4); K.Label(tc, l.name, K.FSs, K.Mut);
                var tb = G.Table(l); int pos = tb.FindIndex(r => r.id == fav);
                int a = Mathf.Clamp(pos - 3, 0, Mathf.Max(0, tb.Count - 7)), b = Mathf.Min(tb.Count, a + 7);
                for (int i = a; i < b; i++) TableRow(tc, l, tb, i);
                K.Btn(tc, "Ganze Tabelle", () => { viewLeague = l.id; Go("table"); }, K.Card2, 100);
            }
            var mc = K.CardBox(content);
            K.Btn(mc, "Zum Hauptmenü", () => { Save(); G = null; Go("title"); }, K.Card2, 100);
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
            K.Cell(r, sc, big ? 150 : 120, TextAnchor.MiddleCenter, col, FontStyle.Bold, big ? 44 : 34);
            K.Crest(r, a, big ? 90 : 60);
            K.Cell(r, a.name, -1, TextAnchor.MiddleLeft, m.a == fav ? K.Acc : K.Txt, m.a == G.S.fav ? FontStyle.Bold : FontStyle.Normal, big ? 36 : 32);
        }

        void TeamLine(Transform p, int id, Action on)
        {
            var t = G.T(id); var l = G.LeagueOf(id);
            var r = K.HBox(p, 120, 20, 20, K.Card);
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
            var tb = G.Table(l);
            var c = K.CardBox(content, 16, 0);
            var h = K.HBox(c, 64, 10, 8);
            K.Cell(h, "#", 64, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 28); K.Cell(h, "", 56, TextAnchor.MiddleCenter);
            K.Cell(h, "Verein", -1, TextAnchor.MiddleLeft, K.Mut, FontStyle.Normal, 28);
            K.Cell(h, "Sp", 64, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 28); K.Cell(h, "Diff", 84, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 28); K.Cell(h, "Pkt", 84, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 28);
            for (int i = 0; i < tb.Count; i++) TableRow(c, l, tb, i);
            var lg = K.HBox(content, 60, 24);
            Legend(lg, K.Up, "Aufstieg"); Legend(lg, K.Rel, "Relegation"); Legend(lg, K.Down, "Abstieg");
            var bh = K.HBox(content, 110, 16);
            K.Btn(bh, "Spielplan", () => { viewRound = -1; Go("games"); });
            LeagueLinks(l);
        }
        void Legend(Transform p, Color c, string s) { var b = K.Rect("Farbe", p); b.gameObject.AddComponent<Image>().color = c; K.LE(b, 24, 24); K.Cell(p, s, 220, TextAnchor.MiddleLeft, K.Mut, FontStyle.Normal, 28); }

        void TableRow(Transform p, League l, List<Row> tbl, int i)
        {
            var row = tbl[i]; var t = G.T(row.id); bool me = row.id == G.S.fav;
            var r = K.HBox(p, 84, 10, 8, me ? K.Card2 : (Color?)null);
            int z = G.Zone(l, i, tbl.Count);
            var bar = K.Rect("Zone", r); bar.gameObject.AddComponent<Image>().color = z == 1 ? K.Up : z == 2 || z == -2 ? K.Rel : z == -1 ? K.Down : new Color(0, 0, 0, 0); K.LE(bar, 8, 64);
            K.Cell(r, (i + 1).ToString(), 48, TextAnchor.MiddleCenter, K.Mut);
            K.Crest(r, t, 56);
            K.Cell(r, t.name, -1, TextAnchor.MiddleLeft, me ? K.Acc : K.Txt, me ? FontStyle.Bold : FontStyle.Normal, 34);
            K.Cell(r, row.sp.ToString(), 64, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 32);
            K.Cell(r, (row.Diff > 0 ? "+" : "") + row.Diff, 84, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 32);
            K.Cell(r, row.p.ToString(), 84, TextAnchor.MiddleCenter, K.Txt, FontStyle.Bold, 34);
            int id = row.id; K.Click(r, () => { viewTeam = id; Go("team"); });
        }

        void LeagueHead(League l)
        {
            var c = K.CardBox(content, 28, 6);
            K.Label(c, l.name, K.FSh, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold);
            string vb; string info = l.foreign ? "Ausland" : "Stufe " + l.level + (l.vb != "" && VB.TryGetValue(l.vb, out vb) ? " · " + vb : "") + (l.kreis != "" ? " · Kreis " + l.kreis : "");
            K.Label(c, info + " · " + l.teams.Count + " Vereine", K.FSs, K.Mut);
        }

        void LeagueLinks(League l)
        {
            if (l.foreign) return;
            var c = K.CardBox(content, 24, 10);
            League up = null;
            if (l.level == 2) up = G.L("bl"); else if (l.level == 3) up = G.L("bl2"); else if (l.level == 4) up = G.L("l3");
            else if (l.level == 5) up = G.L(G.RegionOf(l.vb));
            else if (l.level > 5) up = G.LeagueByName(l.up) ?? G.S.leagues.FirstOrDefault(u => !u.foreign && u.level == l.level - 1 && u.vbs.Contains(l.vb));
            if (up != null) { K.Label(c, "Nächsthöhere Liga", 28, K.Mut); var lid = up.id; K.Btn(c, "▲  " + up.name, () => { viewLeague = lid; Go("table"); }, K.Card2, 96, -1, 34); }
            List<League> subs;
            if (l.level == 1) subs = new List<League> { G.L("bl2") };
            else if (l.level == 2) subs = new List<League> { G.L("l3") };
            else if (l.level == 3) subs = Game.RegionalLeagues.Select(x => G.L(x)).ToList();
            else if (l.level == 4) subs = G.S.leagues.Where(x => !x.foreign && x.level == 5 && G.RegionOf(x.vb) == l.id).ToList();
            else subs = G.S.leagues.Where(x => !x.foreign && x.level == l.level + 1 && x.up == l.name).ToList();
            if (subs.Count > 0)
            {
                K.Label(c, "Unterbau", 28, K.Mut);
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
            var c = K.CardBox(content, 16, 6);
            foreach (var m in l.rounds[viewRound].m) MatchLine(c, m, false, -1);
            int spielfrei = l.teams.Count % 2 == 1 ? l.teams.FirstOr(id => !l.rounds[viewRound].m.Any(m => m.h == id || m.a == id), -1) : -1;
            if (spielfrei >= 0) K.Label(c, "Spielfrei: " + G.T(spielfrei).name, 28, K.Mut);
            if (G.S.fav >= 0 && G.LeagueOf(G.S.fav) == l)
            {
                var fc = K.CardBox(content, 16, 6); K.Label(fc, "Spiele von " + G.T(G.S.fav).name, K.FSs, K.Mut);
                foreach (var x in G.FixturesOf(G.S.fav)) MatchLine(fc, x.Value, false, G.S.fav);
            }
        }

        // ---------- Kader ----------
        void SquadTab()
        {
            int id = viewTeam >= 0 ? viewTeam : G.S.fav; var t = G.T(id);
            var sq = G.Squad(id);
            var c = K.CardBox(content, 24, 6);
            var hr = K.HBox(c, 120, 24); K.Crest(hr, t, 110);
            var hv = K.VBox(hr, 2); K.LE(hv, -1, -1, 1);
            K.Label(hv, t.name, 42, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold);
            K.Label(hv, sq.Count + " Spieler · Stärke " + t.r.ToString("0.0"), K.FSs, K.Mut);
            var names = new Dictionary<string, string> { { "TW", "Torwart" }, { "AB", "Abwehr" }, { "MF", "Mittelfeld" }, { "ST", "Sturm" } };
            foreach (var pos in Game.Pos)
            {
                var ps = sq.Select(x => G.S.players[x]).Where(x => x.p == pos).OrderByDescending(x => x.s).ToList(); if (ps.Count == 0) continue;
                var pc = K.CardBox(content, 16, 0);
                K.Label(pc, names[pos], K.FSs, K.Acc, TextAnchor.MiddleLeft, FontStyle.Bold);
                foreach (var p in ps)
                {
                    var r = K.HBox(pc, 80, 10, 8);
                    K.Cell(r, p.no > 0 ? p.no.ToString() : "", 64, TextAnchor.MiddleCenter, K.Mut);
                    K.Cell(r, p.n, -1, TextAnchor.MiddleLeft, K.Txt, FontStyle.Normal, 34);
                    K.Cell(r, Short(p.nat), 96, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 28);
                    K.Cell(r, p.a.ToString(), 60, TextAnchor.MiddleCenter, K.Mut, FontStyle.Normal, 30);
                    K.Cell(r, p.s.ToString("0"), 70, TextAnchor.MiddleCenter, K.Txt, FontStyle.Bold, 34);
                    K.Cell(r, Util.Money(G.PlayerValue(p)), 200, TextAnchor.MiddleRight, K.Mut, FontStyle.Normal, 28);
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
                var hc = K.CardBox(content, 24, 8); K.Label(hc, vbn ?? vbView, K.FSh, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold);
                K.Btn(hc, "◀  Alle Verbände", () => { vbView = null; Render(); }, K.Card2, 96);
                foreach (var g in G.S.leagues.Where(l => !l.foreign && l.level >= 5 && (l.vb == vbView || l.vbs.Contains(vbView))).GroupBy(l => l.level).OrderBy(x => x.Key))
                {
                    var c = K.CardBox(content, 20, 8); K.Label(c, "Stufe " + g.Key + " · " + LevelName(g.First()), K.FSs, K.Acc, TextAnchor.MiddleLeft, FontStyle.Bold);
                    foreach (var l in g.OrderBy(x => x.name)) { var lid = l.id; K.Btn(c, l.name + "  (" + l.teams.Count + ")", () => { viewLeague = lid; Go("table"); }, K.Card2, 92, -1, 32); }
                }
                return;
            }
            var pc = K.CardBox(content, 20, 8); K.Label(pc, "Profiligen", K.FSs, K.Acc, TextAnchor.MiddleLeft, FontStyle.Bold);
            foreach (var id in Game.ProLeagues) { var l = G.L(id); if (l == null) continue; K.Btn(pc, l.name, () => { viewLeague = id; Go("table"); }, K.Card2, 92, -1, 34); }
            var vc = K.CardBox(content, 20, 8); K.Label(vc, "Landesverbände (ab Oberliga abwärts)", K.FSs, K.Acc, TextAnchor.MiddleLeft, FontStyle.Bold);
            foreach (var kv in VB.OrderBy(x => x.Value))
            {
                string code = kv.Key; int n = G.S.leagues.Count(l => !l.foreign && l.level >= 5 && (l.vb == code || l.vbs.Contains(code))); if (n == 0) continue;
                K.Btn(vc, kv.Value + "  ·  " + n + " Ligen", () => { vbView = code; Render(); }, K.Card2, 92, -1, 34);
            }
            var fc = K.CardBox(content, 20, 8); K.Label(fc, "Ausland", K.FSs, K.Acc, TextAnchor.MiddleLeft, FontStyle.Bold);
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
            var c = K.CardBox(content, 28, 10);
            var hr = K.HBox(c, 180, 28); K.Crest(hr, t, 160);
            var hv = K.VBox(hr, 4); K.LE(hv, -1, -1, 1);
            K.Label(hv, t.name, 46, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold);
            if (l != null)
            {
                var tb = G.Table(l); int pos = tb.FindIndex(r => r.id == id);
                K.Label(hv, l.name, K.FSs, K.Acc); K.Label(hv, "Platz " + (pos + 1) + " · Stärke " + t.r.ToString("0.0"), K.FSs, K.Mut);
            }
            if (G.S.fav < 0)
            {
                K.Btn(c, "Diesen Verein übernehmen", () => { G.S.fav = id; viewTeam = -1; viewLeague = null; Save(); Go("home"); }, K.Acc, 130, -1, 42, Color.white);
                K.Btn(c, "◀  Zurück zur Suche", () => Go("pick"), K.Card2, 100);
            }
            var bh = K.HBox(c, 110, 16);
            K.Btn(bh, "Kader", () => { viewTeam = id; Go("squad"); });
            if (l != null) { var lid = l.id; K.Btn(bh, "Tabelle", () => { viewLeague = lid; Go("table"); }); }
            TitlesCard(id);
            CupRunsCard(id);
            var fx = G.FixturesOf(id);
            if (fx.Count > 0)
            {
                var fc = K.CardBox(content, 16, 6); K.Label(fc, "Spiele", K.FSs, K.Mut);
                foreach (var x in fx) MatchLine(fc, x.Value, false, id);
            }
        }

        // ---------- Saison ----------
        void SeasonTab()
        {
            int fav = G.S.fav; var h = G.S.hist.FirstOrDefault(x => x.team == fav);
            var c = K.CardBox(content, 24, 6); K.Label(c, "Vereinsgeschichte", K.FSh, K.Txt, TextAnchor.MiddleLeft, FontStyle.Bold);
            if (h == null || h.e.Count == 0) K.Label(c, "Noch keine Saison abgeschlossen.", K.FSs, K.Mut);
            else foreach (var e in h.e)
                {
                    var r = K.HBox(c, 76, 12);
                    K.Cell(r, Sl(e.season), 150, TextAnchor.MiddleLeft, K.Mut, FontStyle.Normal, 32);
                    K.Cell(r, e.league, -1, TextAnchor.MiddleLeft, K.Txt, FontStyle.Normal, 32);
                    K.Cell(r, e.pos + ". / " + e.n, 140, TextAnchor.MiddleRight, e.pos == 1 ? K.Gold : K.Txt, FontStyle.Bold, 32);
                }
            TitlesCard(fav);
            if (G.S.log.Count == 0) return;
            var lg = G.S.log[0]; string fn = G.T(fav).name;
            var lc = K.CardBox(content, 24, 6); K.Label(lc, "Saison " + Sl(lg.season) + " – Meldungen", K.FSs, K.Acc, TextAnchor.MiddleLeft, FontStyle.Bold);
            var mine = lg.lines.Where(x => x.Contains(fn)).ToList();
            foreach (var x in mine) K.Label(lc, "★ " + x, 32, K.Gold);
            var lines = showAllLog ? lg.lines.Take(400).ToList() : lg.lines.Where(x => !x.Contains(fn)).Take(25).ToList();
            foreach (var x in lines) K.Label(lc, x, 30, K.Txt);
            if (!showAllLog && lg.lines.Count > 25) K.Btn(lc, "Mehr anzeigen (" + lg.lines.Count + " Meldungen)", () => { showAllLog = true; Render(); }, K.Card2, 96);
        }
    }
}
