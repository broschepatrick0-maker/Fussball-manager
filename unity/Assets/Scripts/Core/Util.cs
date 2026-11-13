using System;
using System.Collections.Generic;

namespace FP.Core
{
    public static class Util
    {
        // wie FirstOrDefault mit eigenem Ersatzwert (das gibt es in Unitys .NET-Profil nicht)
        public static int FirstOr(this IEnumerable<int> a, Func<int, bool> f, int def)
        {
            foreach (var x in a) if (f(x)) return x;
            return def;
        }
        public static string Money(double v)
        {
            if (v < 0) return "−" + Money(-v);
            if (v >= 1e6) return (v / 1e6).ToString(v >= 1e7 ? "0" : "0.0", System.Globalization.CultureInfo.InvariantCulture).Replace('.', ',') + " Mio. €";
            if (v >= 1e3) return Math.Round(v / 1e3) + " Tsd. €";
            return Math.Round(v) + " €";
        }
    }
}
