//
// fmtduration
//
// fmtduration produces a string representing d in the form "72h3m0.5s".
// Leading zero units are omitted. As a special case, durations less than one
// second format use a smaller unit (milli-, micro-, or nanoseconds) to ensure
// that the leading digit is non-zero. The zero duration formats as 0s.
//
// u32 fmtduration(f64)  writes to shared buffer, returns buffer offset
// void* bufptr()        provides the address of the shared buffer
// u32 bufsize()         provides the size of the shared buffer
//
// Run unit test:
//   cc -g -DUNIT_TEST fmtduration.c -o fmtduration && ./fmtduration
//
// Compile wasm:
//   docker run --rm -t -v "$PWD:/src" rsms/emsdk:latest \
//   emcc fmtduration.c -o fmtduration.js \
//     -O3 \
//     --llvm-lto 0 \
//     --llvm-opts 2 \
//     -s WASM=1 \
//     -s NO_EXIT_RUNTIME=1 \
//     -s NO_FILESYSTEM=1 \
//     -s ABORTING_MALLOC=0 \
//     -s NO_EXIT_RUNTIME=1 \
//     -s NO_FILESYSTEM=1
//
//     -g
//
#ifdef UNIT_TEST
  #include <stdio.h>
  #include <string.h> // memset, memcmp
  #include <stdlib.h> // exit
  #define EMSCRIPTEN_KEEPALIVE  /* nothing */
#else
  #include <emscripten/emscripten.h>
#endif

typedef long long i64;
typedef unsigned long long u64;
typedef unsigned int u32;
typedef unsigned char byte;
typedef byte bool;
typedef double f64;

typedef i64 Duration;

static const Duration Nanosecond  = (Duration)(1);
static const Duration Microsecond = (Duration)(1000) * Nanosecond;
static const Duration Millisecond = (Duration)(1000) * Microsecond;
static const Duration Second      = (Duration)(1000) * Millisecond;
static const Duration Minute      = (Duration)(60) * Second;
static const Duration Hour        = (Duration)(60) * Minute;

static byte buf[32]; // Largest time is 2540400h10m10.000000000s


// fmtFrac formats the fraction of v/10**prec (e.g., ".12345") into the
// tail of buf, omitting trailing zeros. It omits the decimal
// point too when the fraction is 0. It returns the index where the
// output bytes begin and writes the value v/10**prec to vptr.
static u32 fmtFrac(u32 w, u64* vptr, u32 prec) {
  // Omit trailing zeros up to and including decimal point.
  u64 v = *vptr;
  bool print = 0;
  for (u32 i = 0; i < prec; i++) {
    u64 digit = v % 10;
    print = print || digit != 0;
    if (print) {
      w--;
      buf[w] = (byte)(digit) + '0';
    }
    v /= 10;
  }
  if (print) {
    w--;
    buf[w] = '.';
  }
  *vptr = v;
  return w;
}


// fmtInt formats v into the tail of buf.
// It returns the index where the output begins.
static u32 fmtInt(u32 w, u64 v) {
  if (v == 0) {
    w--;
    buf[w] = '0';
  } else {
    while (v > 0) {
      w--;
      buf[w] = (byte)(v % 10) + '0';
      v /= 10;
    }
  }
  return w;
}


EMSCRIPTEN_KEEPALIVE const byte* bufptr() {
  return buf;
}


EMSCRIPTEN_KEEPALIVE u32 bufsize() {
  return sizeof(buf);
}


EMSCRIPTEN_KEEPALIVE u32 fmtduration(Duration d) {
  u32 w = sizeof(buf);

  u64 u = (u64)d;
  bool neg = d < 0;
  if (neg) {
    u = -u;
  }

  if (u < (u64)(Second)) {
    // Special case: if duration is smaller than a second,
    // use smaller units, like 1.2ms
    u32 prec = 0;
    w--;
    buf[w] = 's';
    w--;
    if (u == 0) {
      buf[w] = '0';
      return w;
    } else if (u < (u64)(Microsecond)) {
      // print nanoseconds
      prec = 0;
      buf[w] = 'n';
    } else if (u < (u64)(Millisecond)) {
      // print microseconds
      prec = 3;
      // U+00B5 'µ' as UTF8 = 0xC2 0xB5
      #ifdef UNIT_TEST
        // C interprets each byte as a UTF8 byte
        buf[w--] = 0xB5;
        buf[w] = 0xc2;
      #else
        // js interprets each byte as a codepoint
        buf[w] = 0xB5;
      #endif
    } else {
      // print milliseconds
      prec = 6;
      buf[w] = 'm';
    }
    w = fmtFrac(w, &u, prec);
    w = fmtInt(w, u);
  } else {
    w--;
    buf[w] = 's';

    w = fmtFrac(w, &u, 9);

    // u is now integer seconds
    w = fmtInt(w, u % 60);
    u /= 60;

    // u is now integer minutes
    if (u > 0) {
      w--;
      buf[w] = 'm';
      w = fmtInt(w, u % 60);
      u /= 60;

      // u is now integer hours
      // Stop at hours because days can be different lengths.
      if (u > 0) {
        w--;
        buf[w] = 'h';
        w = fmtInt(w, u);
      }
    }
  }

  if (neg) {
    w--;
    buf[w] = '-';
  }

  return w;
}


#ifdef UNIT_TEST

typedef struct {
  const char* str;
  Duration d;
} TestSample;

const TestSample durationTests[] = {
  {"0s", 0},
  {"1ns", 1 * Nanosecond},
  {"1.1µs", 1100 * Nanosecond},
  {"2.2ms", 2200 * Microsecond},
  {"3.3s", 3300 * Millisecond},
  {"4m5s", 4*Minute + 5*Second},
  {"4m5.001s", 4*Minute + 5001*Millisecond},
  {"5h6m7.001s", 5*Hour + 6*Minute + 7001*Millisecond},
  {"8m0.000000001s", 8*Minute + 1*Nanosecond},
  {"2562047h47m16.854775807s", (Duration)(((u64)(1) << 63) - 1) },
  {"-2562047h47m16.854775808s", (Duration)((u64)(-1) << 63) },
  {NULL,0}, // sentinel
};

void fail(const TestSample* t, u32 w) {
  u32 len = sizeof(buf) - w;
  fprintf(
    stderr,
    "failure: \"%s\" -- instead got \"%.*s\" for Duration %lld\n",
    t->str,
    (int)len, &buf[w],
    t->d
  );
  exit(1);
}

int main(int argc, char** argv) {
  for (u32 i = 0; 1; i++) {
    const TestSample* t = &durationTests[i];
    if (t->str == NULL) {
      break;
    }

    memset((void*)buf, (int)'_', sizeof(buf));

    u32 w = fmtduration(t->d);
    u32 len = sizeof(buf) - w;

    // printf("fmtduration(%lld) => \"%.*s\" (w=%u, len=%u); expect \"%s\"\n",
    //   t->d, (int)len, &buf[w], w, len, t->str);

    if (strlen(t->str) != len) {
      fail(t, w);
      break;
    }

    if (memcmp(&buf[w], t->str, len) != 0) {
      fail(t, w);
      break;
    }
  }

  // printf("buf = \"%.*s\"\n", (int)sizeof(buf), buf);

  return 0;
}

#endif /* defined(UNIT_TEST) */
