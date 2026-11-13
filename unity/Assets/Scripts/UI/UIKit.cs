// Baukasten für die Oberfläche: alles wird per Code erzeugt, damit keine Szene oder Prefabs eingerichtet werden müssen.
// Gestaltung: dunkles Stadion-Grün, abgerundete Karten mit Rand und Schatten, Barlow Condensed für Überschriften, Inter für Text.
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using FP.Core;

namespace FP.UI
{
    public static class K
    {
        public static Font F, FB, FH;   // Text, Text fett, Überschrift
        public static readonly Color Bg = Hex("#0a110e"), Bg2 = Hex("#0f1a15"), Side = Hex("#0d1612"), Card = Hex("#142019"), Card2 = Hex("#1c2b23"), Card3 = Hex("#23362c"),
            Line = Hex("#263a30"), Txt = Hex("#eaf2ec"), Mut = Hex("#8ea398"), Acc = Hex("#3fb37f"), AccD = Hex("#24855a"), AccL = Hex("#5fd39b"),
            Up = Hex("#3fb37f"), Rel = Hex("#e0a83a"), Down = Hex("#e2574f"), Gold = Hex("#f0c94a"), Blue = Hex("#5b8def");
        public const int FS = 38, FSs = 32, FSh = 54;
        public static bool Desk;   // PC-Ansicht (Querformat) – für dichtere Layouts
        static Texture2D circle;
        static readonly Dictionary<string, Texture2D> crestCache = new Dictionary<string, Texture2D>();
        static readonly Dictionary<string, Sprite> spriteCache = new Dictionary<string, Sprite>();

        public static Color Hex(string h) { Color c; return !string.IsNullOrEmpty(h) && ColorUtility.TryParseHtmlString(h, out c) ? c : new Color(.36f, .42f, .38f); }
        public static Color A(Color c, float a) { c.a = a; return c; }
        public static Color Mix(Color a, Color b, float t) { return Color.Lerp(a, b, t); }

        public static void Init()
        {
            if (F != null) return;
            F = Resources.Load<Font>("Fonts/Inter-Regular");
            FB = Resources.Load<Font>("Fonts/Inter-SemiBold");
            FH = Resources.Load<Font>("Fonts/BarlowCondensed-Bold");
            Font fb = null;
            try { fb = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf"); } catch (Exception) { }
            if (fb == null) try { fb = Resources.GetBuiltinResource<Font>("Arial.ttf"); } catch (Exception) { }
            if (fb == null) fb = Font.CreateDynamicFontFromOSFont("Arial", 32);
            if (F == null) F = fb; if (FB == null) FB = F; if (FH == null) FH = FB;
        }

        // ---------- Sprites (zur Laufzeit erzeugt, 9-geteilt) ----------
        // Abgerundetes Rechteck mit optionalem Rand; weiß, damit Image.color einfärbt (oder mit festen Farben, wenn fill/border angegeben)
        public static Sprite Round(int r, int border = 0, Color? fill = null, Color? edge = null)
        {
            string key = r + "|" + border + "|" + (fill.HasValue ? ColorUtility.ToHtmlStringRGBA(fill.Value) : "-") + "|" + (edge.HasValue ? ColorUtility.ToHtmlStringRGBA(edge.Value) : "-");
            Sprite sp; if (spriteCache.TryGetValue(key, out sp)) return sp;
            int n = r * 2 + 4; var tex = new Texture2D(n, n, TextureFormat.RGBA32, false); tex.wrapMode = TextureWrapMode.Clamp; tex.filterMode = FilterMode.Bilinear;
            var px = new Color32[n * n]; Color fc = fill ?? Color.white, ec = edge ?? fc;
            for (int y = 0; y < n; y++) for (int x = 0; x < n; x++)
                {
                    // Abstand zum abgerundeten Rand (negativ = innen)
                    float cx = Mathf.Clamp(x + .5f, r, n - r), cy = Mathf.Clamp(y + .5f, r, n - r);
                    float d = Mathf.Sqrt((x + .5f - cx) * (x + .5f - cx) + (y + .5f - cy) * (y + .5f - cy)) - r;
                    float a = Mathf.Clamp01(.5f - d);
                    Color c = fc;
                    if (border > 0) { float inner = Mathf.Clamp01(.5f - (d + border)); c = Color.Lerp(ec, fc, inner); }
                    c.a *= a; px[y * n + x] = c;
                }
            tex.SetPixels32(px); tex.Apply();
            sp = Sprite.Create(tex, new Rect(0, 0, n, n), new Vector2(.5f, .5f), 100, 0, SpriteMeshType.FullRect, new Vector4(r + 1, r + 1, r + 1, r + 1));
            spriteCache[key] = sp; return sp;
        }
        // weicher Schatten (unscharfer Rand) für Karten
        public static Sprite SoftShadow()
        {
            Sprite sp; if (spriteCache.TryGetValue("shadow", out sp)) return sp;
            int r = 28, n = r * 2 + 4; var tex = new Texture2D(n, n, TextureFormat.RGBA32, false); tex.wrapMode = TextureWrapMode.Clamp;
            var px = new Color32[n * n];
            for (int y = 0; y < n; y++) for (int x = 0; x < n; x++)
                {
                    float cx = Mathf.Clamp(x + .5f, r, n - r), cy = Mathf.Clamp(y + .5f, r, n - r);
                    float d = Mathf.Sqrt((x + .5f - cx) * (x + .5f - cx) + (y + .5f - cy) * (y + .5f - cy));
                    float a = Mathf.Clamp01(1 - d / r); a = a * a * (3 - 2 * a);
                    px[y * n + x] = new Color(0, 0, 0, a * .55f);
                }
            tex.SetPixels32(px); tex.Apply();
            sp = Sprite.Create(tex, new Rect(0, 0, n, n), new Vector2(.5f, .5f), 100, 0, SpriteMeshType.FullRect, new Vector4(r + 1, r + 1, r + 1, r + 1));
            spriteCache["shadow"] = sp; return sp;
        }
        // senkrechter Farbverlauf (für Hintergründe und Kopfbereiche)
        public static Texture2D Gradient(Color top, Color bottom)
        {
            var tex = new Texture2D(1, 64, TextureFormat.RGBA32, false); tex.wrapMode = TextureWrapMode.Clamp;
            for (int y = 0; y < 64; y++) tex.SetPixel(0, y, Color.Lerp(bottom, top, y / 63f));
            tex.Apply(); return tex;
        }
        public static Image Panel(RectTransform r, Color c, int radius = 16)
        {
            var img = r.GetComponent<Image>(); if (img == null) img = r.gameObject.AddComponent<Image>();
            img.sprite = Round(radius); img.type = Image.Type.Sliced; img.color = c;
            return img;
        }

        public static RectTransform Rect(string name, Transform parent)
        {
            var go = new GameObject(name, typeof(RectTransform)); go.transform.SetParent(parent, false);
            return (RectTransform)go.transform;
        }
        public static void Fill(RectTransform r) { r.anchorMin = Vector2.zero; r.anchorMax = Vector2.one; r.offsetMin = r.offsetMax = Vector2.zero; }
        public static LayoutElement LE(Component c, float w = -1, float h = -1, float flexW = -1, float flexH = -1)
        {
            var le = c.GetComponent<LayoutElement>(); if (le == null) le = c.gameObject.AddComponent<LayoutElement>();
            if (w >= 0) { le.minWidth = w; le.preferredWidth = w; }
            if (h >= 0) { le.minHeight = h; le.preferredHeight = h; }
            if (flexW >= 0) le.flexibleWidth = flexW;
            if (flexH >= 0) le.flexibleHeight = flexH;
            return le;
        }
        public static void Ignore(Component c) { LE(c).ignoreLayout = true; }

        public static RectTransform VBox(Transform p, float spacing = 0, int pad = 0, Color? bg = null, string name = "VBox")
        {
            var r = Rect(name, p); if (bg.HasValue) Panel(r, bg.Value, 14);
            var v = r.gameObject.AddComponent<VerticalLayoutGroup>();
            v.spacing = spacing; v.padding = new RectOffset(pad, pad, pad, pad);
            v.childControlWidth = true; v.childControlHeight = true; v.childForceExpandWidth = true; v.childForceExpandHeight = false;
            return r;
        }
        public static RectTransform HBox(Transform p, float h, float spacing = 16, int padX = 0, Color? bg = null, string name = "HBox")
        {
            var r = Rect(name, p); if (bg.HasValue) Panel(r, bg.Value, 12);
            var x = r.gameObject.AddComponent<HorizontalLayoutGroup>();
            x.spacing = spacing; x.padding = new RectOffset(padX, padX, 0, 0); x.childAlignment = TextAnchor.MiddleLeft;
            x.childControlWidth = true; x.childControlHeight = true; x.childForceExpandWidth = false; x.childForceExpandHeight = false;
            if (h > 0) LE(r, -1, h);
            return r;
        }
        // Spalten: am PC nebeneinander (oben ausgerichtet), auf dem Handy untereinander im selben Container
        public static RectTransform[] Columns(Transform p, float spacing, params float[] flex)
        {
            var res = new RectTransform[flex.Length];
            if (!Desk) { for (int i = 0; i < flex.Length; i++) res[i] = (RectTransform)p; return res; }
            var row = Rect("Spalten", p); var h = row.gameObject.AddComponent<HorizontalLayoutGroup>();
            h.spacing = spacing; h.childAlignment = TextAnchor.UpperLeft; h.childControlWidth = true; h.childControlHeight = true; h.childForceExpandWidth = false; h.childForceExpandHeight = false;
            for (int i = 0; i < flex.Length; i++)
            {
                var c = VBox(row, 24, 0, null, "Spalte"); var le = LE(c, -1, -1, flex[i]); le.minWidth = 0; le.preferredWidth = 0; res[i] = c;
            }
            return res;
        }

        static Font FontFor(FontStyle st) { return st == FontStyle.Bold || st == FontStyle.BoldAndItalic ? FB : F; }
        public static Text Label(Transform p, string s, int size = FS, Color? c = null, TextAnchor a = TextAnchor.MiddleLeft, FontStyle st = FontStyle.Normal, float w = -1, bool wrap = true)
        {
            var r = Rect("Text", p); var t = r.gameObject.AddComponent<Text>();
            t.font = FontFor(st); t.text = s; t.fontSize = size; t.color = c ?? Txt; t.alignment = a; t.raycastTarget = false;
            t.fontStyle = st == FontStyle.Italic || st == FontStyle.BoldAndItalic ? FontStyle.Italic : FontStyle.Normal;
            if (t.font == F && st == FontStyle.Bold) t.fontStyle = FontStyle.Bold;   // nur, wenn keine fette Schrift geladen ist
            t.lineSpacing = 1.05f;
            t.horizontalOverflow = wrap ? HorizontalWrapMode.Wrap : HorizontalWrapMode.Overflow; t.verticalOverflow = VerticalWrapMode.Overflow;
            if (w >= 0) LE(t, w); else LE(t, -1, -1, 1);
            return t;
        }
        // Überschrift in Barlow Condensed, Großbuchstaben
        public static Text Head(Transform p, string s, int size = FSh, Color? c = null, TextAnchor a = TextAnchor.MiddleLeft)
        {
            var t = Label(p, s.ToUpperInvariant(), size, c, a); t.font = FH; t.fontStyle = FontStyle.Normal; t.lineSpacing = .9f; return t;
        }
        // kleine Rubrik über einer Karte (grün, Großbuchstaben)
        public static Text Kicker(Transform p, string s, Color? c = null) { var t = Head(p, s, 30, c ?? Acc); return t; }

        // Einzeilig, abgeschnitten (für Tabellen)
        public static Text Cell(Transform p, string s, float w, TextAnchor a = TextAnchor.MiddleLeft, Color? c = null, FontStyle st = FontStyle.Normal, int size = FS)
        {
            var t = Label(p, s, size, c, a, st, w); t.horizontalOverflow = HorizontalWrapMode.Wrap; t.verticalOverflow = VerticalWrapMode.Truncate;
            if (w < 0) { var le = LE(t, -1, -1, 1); le.minWidth = 0; le.preferredWidth = 0; }
            return t;
        }

        // Knopf: abgerundet, mit Hover- und Klick-Rückmeldung
        public static Button Btn(Transform p, string s, Action on, Color? bg = null, float h = 110, float w = -1, int size = FS, Color? fg = null)
        {
            var r = Rect("Button", p); var img = Panel(r, bg ?? Card2, 14);
            var b = r.gameObject.AddComponent<Button>(); b.targetGraphic = img;
            var cb = b.colors; cb.normalColor = new Color(.93f, .93f, .93f, 1); cb.highlightedColor = Color.white;
#if UNITY_2019_1_OR_NEWER
            cb.selectedColor = cb.normalColor;
#endif
            cb.pressedColor = new Color(.75f, .75f, .75f, 1); cb.fadeDuration = .08f; b.colors = cb;
            var nav = b.navigation; nav.mode = Navigation.Mode.None; b.navigation = nav;
            if (on != null) b.onClick.AddListener(() => on());
            var t = Label(r, s, size, fg ?? Txt, TextAnchor.MiddleCenter, FontStyle.Bold); Fill(t.rectTransform); t.rectTransform.offsetMin = new Vector2(12, 0); t.rectTransform.offsetMax = new Vector2(-12, 0);
            LE(b, w, h, w < 0 ? 1 : 0);
            return b;
        }
        // Macht eine ganze Zeile anklickbar; ohne eigenen Hintergrund leuchtet sie beim Überfahren leicht auf
        public static void Click(RectTransform r, Action on)
        {
            var img = r.GetComponent<Image>(); var b = r.gameObject.AddComponent<Button>();
            var cb = b.colors; cb.fadeDuration = .06f;
            if (img == null)
            {
                img = Panel(r, Color.white, 10);
                cb.normalColor = new Color(1, 1, 1, 0); cb.highlightedColor = new Color(1, 1, 1, .05f); cb.pressedColor = new Color(1, 1, 1, .1f);
#if UNITY_2019_1_OR_NEWER
            cb.selectedColor = cb.normalColor;
#endif
           
            }
            else { cb.normalColor = new Color(.92f, .92f, .92f, 1); cb.highlightedColor = Color.white; cb.pressedColor = new Color(.8f, .8f, .8f, 1);
#if UNITY_2019_1_OR_NEWER
            cb.selectedColor = cb.normalColor;
#endif
            }
            b.targetGraphic = img; b.colors = cb; var nav = b.navigation; nav.mode = Navigation.Mode.None; b.navigation = nav;
            b.onClick.AddListener(() => on());
        }
        public static void Gap(Transform p, float h) { LE(Rect("Gap", p), -1, h); }
        public static void Divider(Transform p) { var r = Rect("Line", p); r.gameObject.AddComponent<Image>().color = Line; LE(r, -1, 2); }

        // Karte mit Rand und weichem Schatten
        public static RectTransform CardBox(Transform p, int pad = 28, float spacing = 12)
        {
            var r = VBox(p, spacing, pad, null, "Card");
            var img = r.gameObject.AddComponent<Image>(); img.sprite = Round(18, 2, Card, Line); img.type = Image.Type.Sliced; img.color = Color.white;
            var sh = r.gameObject.AddComponent<Shadow>(); sh.effectColor = new Color(0, 0, 0, .35f); sh.effectDistance = new Vector2(0, -6);
            return r;
        }
        // hervorgehobene Karte (Akzentkante links)
        public static RectTransform AccentCard(Transform p, Color accent, int pad = 28, float spacing = 12)
        {
            var c = CardBox(p, pad, spacing);
            var bar = Rect("Akzent", c); Ignore(bar); bar.anchorMin = new Vector2(0, 0); bar.anchorMax = new Vector2(0, 1); bar.pivot = new Vector2(0, .5f);
            bar.sizeDelta = new Vector2(8, -28); bar.anchoredPosition = new Vector2(2, 0); Panel(bar, accent, 4);
            return c;
        }
        // kleines Etikett (Pille)
        public static Text Pill(Transform p, string s, Color c, int size = 26, float w = -1)
        {
            var r = Rect("Pille", p); Panel(r, A(c, .16f), 20);
            var t = Label(r, s, size, c, TextAnchor.MiddleCenter, FontStyle.Bold); Fill(t.rectTransform); t.horizontalOverflow = HorizontalWrapMode.Overflow;
            LE(r, w >= 0 ? w : Mathf.Max(80, s.Length * size * .62f + 36), size + 22);
            return t;
        }
        // Kennzahl-Kachel: kleine Beschriftung, große Zahl
        public static RectTransform Stat(Transform p, string label, string value, Color? c = null, float w = -1)
        {
            var r = VBox(p, 2, 18, Card2, "Kennzahl"); ((VerticalLayoutGroup)r.GetComponent<VerticalLayoutGroup>()).padding = new RectOffset(22, 22, 16, 16);
            Label(r, label.ToUpperInvariant(), 24, Mut);
            var v = Head(r, value, 56, c ?? Txt);
            if (w >= 0) LE(r, w); else LE(r, -1, -1, 1).minWidth = 0;
            return r;
        }
        // Fortschrittsbalken
        public static void Bar(Transform p, float v, Color c, float h = 12)
        {
            var r = Rect("Balken", p); Panel(r, Card3, 6); LE(r, -1, h);
            var f = Rect("Fuellung", r); Panel(f, c, 6); f.anchorMin = Vector2.zero; f.anchorMax = new Vector2(Mathf.Clamp01(v), 1); f.offsetMin = f.offsetMax = Vector2.zero;
        }
        // Form: farbige Kästchen S/U/N
        public static void Form(Transform p, IEnumerable<int> res, float size = 52)
        {
            foreach (var x in res)
            {
                var r = Rect("Form", p); Panel(r, x > 0 ? Up : x < 0 ? Down : Rel, 8); LE(r, size, size);
                var t = Label(r, x > 0 ? "S" : x < 0 ? "N" : "U", (int)(size * .5f), Color.white, TextAnchor.MiddleCenter, FontStyle.Bold); Fill(t.rectTransform);
            }
        }

        // ---------- Wappen ----------
        static Texture2D Circle()
        {
            if (circle != null) return circle;
            int n = 128; circle = new Texture2D(n, n, TextureFormat.RGBA32, false);
            var px = new Color32[n * n]; float c = (n - 1) / 2f, rad = n / 2f - 1;
            for (int y = 0; y < n; y++) for (int x = 0; x < n; x++)
                {
                    float d = Mathf.Sqrt((x - c) * (x - c) + (y - c) * (y - c)); byte a = (byte)(Mathf.Clamp01(rad - d + .5f) * 255);
                    px[y * n + x] = new Color32(255, 255, 255, a);
                }
            circle.SetPixels32(px); circle.Apply(); return circle;
        }
        public static Texture2D CrestTex(string key)
        {
            if (string.IsNullOrEmpty(key)) return null;
            Texture2D t; if (crestCache.TryGetValue(key, out t)) return t;
            t = Resources.Load<Texture2D>("Crests/" + key); crestCache[key] = t; return t;
        }
        public static RectTransform Crest(Transform p, Team t, float size)
        {
            var r = Rect("Crest", p); LE(r, size, size);
            var tex = CrestTex(t.crest);
            if (tex != null) { var ri = r.gameObject.AddComponent<RawImage>(); ri.texture = tex; ri.raycastTarget = false; return r; }
            // Ersatzwappen: Kreis in Vereinsfarbe mit Initialen und hellem Ring
            var ring = r.gameObject.AddComponent<RawImage>(); ring.texture = Circle(); ring.color = A(Hex(t.c2), .9f); ring.raycastTarget = false;
            var inner = Rect("Innen", r); K.Fill(inner); inner.offsetMin = new Vector2(size * .06f, size * .06f); inner.offsetMax = -inner.offsetMin;
            var bgc = inner.gameObject.AddComponent<RawImage>(); bgc.texture = Circle(); bgc.color = Hex(t.c1); bgc.raycastTarget = false;
            var c2 = Hex(t.c2); if (Mathf.Abs(c2.grayscale - bgc.color.grayscale) < .2f) c2 = bgc.color.grayscale > .5f ? Color.black : Color.white;
            var lb = Label(inner, Initials(t.name), Mathf.RoundToInt(size * .34f), c2, TextAnchor.MiddleCenter, FontStyle.Bold); Fill(lb.rectTransform);
            lb.font = FH; lb.fontSize = Mathf.RoundToInt(size * .42f);
            return r;
        }
        public static string Initials(string n)
        {
            var parts = n.Split(new[] { ' ', '-', '.' }, StringSplitOptions.RemoveEmptyEntries); string s = "";
            foreach (var w in parts) { if (char.IsDigit(w[0]) || w.Length < 2) continue; if (char.IsUpper(w[0])) s += w[0]; if (s.Length >= 3) break; }
            return s.Length > 0 ? s : "FC";
        }
        public static void Clear(Transform t) { for (int i = t.childCount - 1; i >= 0; i--) { var c = t.GetChild(i); c.SetParent(null, false); UnityEngine.Object.Destroy(c.gameObject); } }
    }
}
