using System;
using System.Collections.Generic;

namespace FP.Core
{
    // Zufall an einer Stelle, damit Tests mit festem Startwert reproduzierbar sind
    public static class Rng
    {
        static Random r = new Random();
        public static void Seed(int s) { r = new Random(s); }
        public static double U() { return r.NextDouble(); }
        public static int Int(int max) { return r.Next(max); }
        public static double Range(double a, double b) { return a + (b - a) * r.NextDouble(); }
        public static double Gauss() { return (U() + U() + U() - 1.5) * 2; }
        public static int Pois(double l)
        {
            double L = Math.Exp(-l), p = 1; int k = 0;
            do { k++; p *= U(); } while (p > L);
            return k - 1;
        }
        public static T Pick<T>(IList<T> a) { return a[r.Next(a.Count)]; }
        public static void Shuffle<T>(IList<T> a)
        {
            for (int i = a.Count - 1; i > 0; i--) { int j = r.Next(i + 1); T x = a[i]; a[i] = a[j]; a[j] = x; }
        }
        public static string PickW(List<KW> o)
        {
            double s = 0; foreach (var x in o) s += x.w;
            double v = U() * s;
            foreach (var x in o) { v -= x.w; if (v <= 0) return x.k; }
            return o[0].k;
        }
    }
}
