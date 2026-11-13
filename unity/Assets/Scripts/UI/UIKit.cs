// Baukasten für die Oberfläche im Stil der Web-App (dunkles Design, IBM Plex Sans + Barlow Condensed,
// Karten mit runden Ecken und feinen Linien). Maßeinheit = CSS-Pixel der Web-App.
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using FP.Core;

namespace FP.UI
{
    public static class K
    {
        // Farben wie im dunklen Design der Web-App (styles/app.css)
        public static readonly Color Bg = Hex("#0d1411"), Panel = Hex("#141d19"), Ink = Hex("#e3ece7"), Mut = Hex("#8fa199"), Line = Hex("#26332d"),
            Acc = Hex("#3fb27a"), AccInk = Hex("#06150d"), AccSoft = Hex("#18342a"), Up = Hex("#3fb27a"), Rel = Hex("#e0a83a"), Down = Hex("#e2664f"),
            Intl = Hex("#6f9be8"), Board = Hex("#07110c"), Gold = Hex("#e0a83a"), BoardLine = new Color(1, 1, 1, .25f);
        // alte Namen weiter nutzbar
        public static Color Txt { get { return Ink; } }

        public static Font F, FM, FD;   // Text, Text halbfett, Überschriften
        static readonly Dictionary<string, Sprite> sprites = new Dictionary<string, Sprite>();
        static readonly Dictionary<string, Texture2D> crestCache = new Dictionary<string, Texture2D>();
        static readonly Dictionary<string, Texture2D> iconCache = new Dictionary<string, Texture2D>();
        static Texture2D circle;

        public static Color Hex(string h) { Color c; return !string.IsNullOrEmpty(h) && ColorUtility.TryParseHtmlString(h, out c) ? c : new Color(.36f, .42f, .38f); }

        public static void Init()
        {
            if (F != null) return;
            Font fb = null;
            try { fb = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf"); } catch (Exception) { }
            if (fb == null) try { fb = Resources.GetBuiltinResource<Font>("Arial.ttf"); } catch (Exception) { }
            F = Resources.Load<Font>("Fonts/IBMPlexSans-Regular") ?? fb;
            FM = Resources.Load<Font>("Fonts/IBMPlexSans-SemiBold") ?? Resources.Load<Font>("Fonts/IBMPlexSans-Medium") ?? F;
            FD = Resources.Load<Font>("Fonts/BarlowCondensed-Bold") ?? FM;
        }

        // ---------- Grundbausteine ----------
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
        public static LayoutElement Flex(Component c, float f = 1) { var le = LE(c, -1, -1, f); le.minWidth = 0; le.preferredWidth = 0; return le; }

        public static RectTransform VBox(Transform p, float spacing = 0, int pad = 0, Color? bg = null, string name = "VBox")
        {
            var r = Rect(name, p); if (bg.HasValue) r.gameObject.AddComponent<Image>().color = bg.Value;
            var v = r.gameObject.AddComponent<VerticalLayoutGroup>();
            v.spacing = spacing; v.padding = new RectOffset(pad, pad, pad, pad);
            v.childControlWidth = true; v.childControlHeight = true; v.childForceExpandWidth = true; v.childForceExpandHeight = false;
            return r;
        }
        public static RectTransform HBox(Transform p, float h, float spacing = 8, int padX = 0, Color? bg = null, string name = "HBox")
        {
            var r = Rect(name, p); if (bg.HasValue) r.gameObject.AddComponent<Image>().color = bg.Value;
            var x = r.gameObject.AddComponent<HorizontalLayoutGroup>();
            x.spacing = spacing; x.padding = new RectOffset(padX, padX, 0, 0); x.childAlignment = TextAnchor.MiddleLeft;
            x.childControlWidth = true; x.childControlHeight = true; x.childForceExpandWidth = false; x.childForceExpandHeight = false;
            if (h > 0) LE(r, -1, h);
            return r;
        }
        public static void Pad(RectTransform r, int l, int rt, int t, int b) { var g = r.GetComponent<HorizontalOrVerticalLayoutGroup>(); if (g != null) g.padding = new RectOffset(l, rt, t, b); }

        // ---------- Text ----------
        public static Text T(Transform p, string s, float size = 14, Color? c = null, Font font = null, TextAnchor a = TextAnchor.MiddleLeft, float w = -1, bool wrap = true)
        {
            var r = Rect("Text", p); var t = r.gameObject.AddComponent<Text>();
            t.font = font ?? F; t.text = s; t.fontSize = Mathf.RoundToInt(size); t.color = c ?? Ink; t.alignment = a; t.raycastTarget = false; t.lineSpacing = 1.05f;
            t.horizontalOverflow = wrap ? HorizontalWrapMode.Wrap : HorizontalWrapMode.Overflow; t.verticalOverflow = VerticalWrapMode.Overflow;
            if (w >= 0) LE(t, w); else LE(t, -1, -1, 1);
            return t;
        }
        // einzeilig in fester oder flexibler Breite (für Tabellen)
        public static Text Cell(Transform p, string s, float w, TextAnchor a = TextAnchor.MiddleLeft, Color? c = null, Font font = null, float size = 13.5f)
        {
            var t = T(p, s, size, c, font, a, w); t.horizontalOverflow = HorizontalWrapMode.Wrap; t.verticalOverflow = VerticalWrapMode.Truncate;
            if (w < 0) Flex(t);
            LE(t, -1, Mathf.Ceil(size * 1.45f));
            return t;
        }
        // Abschnittsüberschrift wie „DEUTSCHLAND“
        public static Text Section(Transform p, string s) { var t = T(p, s.ToUpperInvariant(), 15, Mut, FM); LE(t, -1, 26); return t; }
        // Kartenüberschrift (.ct): Barlow Condensed, groß
        public static Text CT(Transform p, string s, float size = 20) { return T(p, s.ToUpperInvariant(), size, Ink, FD); }
        public static Text Small(Transform p, string s, Color? c = null) { return T(p, s, 12.5f, c ?? Mut); }

        // ---------- Formen ----------
        // Abgerundetes Rechteck als 9-Slice-Sprite mit eingebranntem Rand (r = Eckradius in px)
        public static Sprite Round(int r, Color fill, Color? border = null)
        {
            string key = r + "|" + ColorUtility.ToHtmlStringRGBA(fill) + "|" + (border.HasValue ? ColorUtility.ToHtmlStringRGBA(border.Value) : "-");
            Sprite s; if (sprites.TryGetValue(key, out s)) return s;
            int sc = 2; int R = Mathf.Max(1, r) * sc; int n = R * 2 + 4 * sc;
            var tex = new Texture2D(n, n, TextureFormat.RGBA32, false); tex.wrapMode = TextureWrapMode.Clamp; tex.filterMode = FilterMode.Bilinear;
            var px = new Color[n * n]; float bw = 1f * sc;
            for (int y = 0; y < n; y++) for (int x = 0; x < n; x++)
            {
                float cx = Mathf.Clamp(x + .5f, R, n - R), cy = Mathf.Clamp(y + .5f, R, n - R);
                float d = R - Mathf.Sqrt((x + .5f - cx) * (x + .5f - cx) + (y + .5f - cy) * (y + .5f - cy)); // Abstand nach innen
                float a = Mathf.Clamp01(d + .5f);
                Color c = fill;
                if (border.HasValue) { float t = Mathf.Clamp01(d - bw + .5f); c = Color.Lerp(border.Value, fill, t); }
                c.a *= a; px[y * n + x] = c;
            }
            tex.SetPixels(px); tex.Apply();
            float b = R + 2 * sc;
            s = Sprite.Create(tex, new Rect(0, 0, n, n), new Vector2(.5f, .5f), 100f * sc, 0, SpriteMeshType.FullRect, new Vector4(b, b, b, b));
            sprites[key] = s; return s;
        }
        public static Image Shape(RectTransform r, Color fill, int radius = 8, Color? border = null)
        {
            var img = r.GetComponent<Image>(); if (img == null) img = r.gameObject.AddComponent<Image>();
            if (radius <= 0 && !border.HasValue) { img.sprite = null; img.color = fill; return img; }
            img.sprite = Round(radius, fill, border); img.type = Image.Type.Sliced; img.color = Color.white; img.pixelsPerUnitMultiplier = 1;
            return img;
        }

        // Karte (.card): Panel, 1px Linie, Radius 8
        public static RectTransform Card(Transform p, int pad = 16, float spacing = 10)
        {
            var r = VBox(p, spacing, pad, null, "Card"); Shape(r, Panel, 8, Line); return r;
        }
        public static void Divider(Transform p, float h = 1) { var r = Rect("Linie", p); r.gameObject.AddComponent<Image>().color = Line; LE(r, -1, h); }
        public static void Gap(Transform p, float h) { LE(Rect("Abstand", p), -1, h); }
        public static RectTransform Spacer(Transform p) { var r = Rect("Platz", p); var le = LE(r, -1, -1, 1, 1); le.minWidth = 0; return r; }

        // ---------- Knöpfe ----------
        public enum B { Primary, Outline, Board, Chip, ChipOn, Ghost, Plain }
        public static Button Btn(Transform p, string s, Action on, B kind = B.Outline, float h = 32, float w = -1, float size = 13.5f, string icon = null)
        {
            var r = Rect("Knopf", p); Image img;
            Color fg = Ink; int rad = 6;
            switch (kind)
            {
                case B.Primary: img = Shape(r, Acc, rad); fg = AccInk; break;
                case B.Board: img = Shape(r, new Color(0, 0, 0, 0), rad, BoardLine); fg = Ink; break;
                case B.Chip: img = Shape(r, Bg, Mathf.RoundToInt(h / 2), Line); break;
                case B.ChipOn: img = Shape(r, Acc, Mathf.RoundToInt(h / 2)); fg = AccInk; break;
                case B.Ghost: img = Shape(r, new Color(0, 0, 0, 0), 0); fg = Mut; break;
                case B.Plain: img = Shape(r, Bg, rad); break;
                default: img = Shape(r, Panel, rad, Line); break;
            }
            var b = r.gameObject.AddComponent<Button>(); b.targetGraphic = img;
            var cb = b.colors; cb.normalColor = Color.white; cb.highlightedColor = new Color(.88f, 1f, .93f, 1); cb.pressedColor = new Color(.75f, .85f, .8f, 1); cb.selectedColor = Color.white; cb.fadeDuration = .06f; b.colors = cb;
            if (on != null) b.onClick.AddListener(() => on());
            var hb = r.gameObject.AddComponent<HorizontalLayoutGroup>(); hb.childAlignment = TextAnchor.MiddleCenter; hb.spacing = 6;
            hb.padding = new RectOffset(kind == B.Chip || kind == B.ChipOn ? 11 : 12, kind == B.Chip || kind == B.ChipOn ? 11 : 12, 0, 0);
            hb.childControlWidth = true; hb.childControlHeight = true; hb.childForceExpandWidth = false; hb.childForceExpandHeight = false;
            if (icon != null) Icon(r, icon, size + 1, fg);
            if (!string.IsNullOrEmpty(s)) { var t = T(r, s, size, fg, kind == B.Primary || kind == B.ChipOn ? FM : F, TextAnchor.MiddleCenter, -1, false); var le = LE(t); le.flexibleWidth = 0; }
            LE(b, w, h, w < 0 ? 0 : -1);
            return b;
        }
        public static void Stretch(Button b) { var le = LE(b); le.flexibleWidth = 1; le.minWidth = 0; }

        // Macht einen Bereich anklickbar (beim Überfahren leicht hervorgehoben)
        public static Button Click(RectTransform r, Action on)
        {
            var img = r.GetComponent<Image>(); bool hover = img == null;
            if (hover) { img = r.gameObject.AddComponent<Image>(); img.color = Color.white; }
            var b = r.gameObject.AddComponent<Button>(); b.targetGraphic = img; b.onClick.AddListener(() => on());
            var cb = b.colors;
            if (hover) { cb.normalColor = new Color(1, 1, 1, 0); cb.highlightedColor = new Color(.24f, .7f, .48f, .12f); cb.pressedColor = new Color(.24f, .7f, .48f, .22f); cb.selectedColor = new Color(1, 1, 1, 0); }
            else { cb.highlightedColor = new Color(.9f, 1, .94f, 1); cb.pressedColor = new Color(.8f, .9f, .85f, 1); cb.selectedColor = Color.white; }
            cb.fadeDuration = .05f; b.colors = cb; return b;
        }

        // ---------- Symbole und Wappen ----------
        public static Texture2D IconTex(string name)
        {
            Texture2D t; if (iconCache.TryGetValue(name, out t)) return t;
            t = Resources.Load<Texture2D>("Icons/" + name); iconCache[name] = t; return t;
        }
        public static RawImage Icon(Transform p, string name, float size, Color c)
        {
            var r = Rect("Symbol", p); LE(r, size, size); r.sizeDelta = new Vector2(size, size);
            var ri = r.gameObject.AddComponent<RawImage>(); ri.texture = IconTex(name); ri.color = c; ri.raycastTarget = false; return ri;
        }
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
            var r = Rect("Wappen", p); LE(r, size, size); r.sizeDelta = new Vector2(size, size);
            var tex = CrestTex(t.crest);
            if (tex != null)
            {
                var ch = Rect("Bild", r); ch.anchorMin = Vector2.zero; ch.anchorMax = Vector2.one; ch.sizeDelta = Vector2.zero;
                var ri = ch.gameObject.AddComponent<RawImage>(); ri.texture = tex; ri.raycastTarget = false;
                var f = ch.gameObject.AddComponent<AspectRatioFitter>(); f.aspectMode = AspectRatioFitter.AspectMode.FitInParent; f.aspectRatio = tex.width / (float)Mathf.Max(1, tex.height);
                return r;
            }
            // Ersatzwappen: Kreis in Vereinsfarbe mit Initialen
            var bgc = r.gameObject.AddComponent<RawImage>(); bgc.texture = Circle(); bgc.color = Hex(t.c1); bgc.raycastTarget = false;
            var c2 = Hex(t.c2); if (Mathf.Abs(c2.grayscale - bgc.color.grayscale) < .2f) c2 = bgc.color.grayscale > .5f ? Color.black : Color.white;
            var lb = T(r, Initials(t.name), Mathf.Max(6, size * .38f), c2, FD, TextAnchor.MiddleCenter, -1, false); Fill(lb.rectTransform);
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
