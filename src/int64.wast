;; Run `node misc/gen-wasm.js` if you update this file

(module
  (export "get_high" (func $get_high))
  (export "mul" (func $mul))
  (export "div_s" (func $div_s))
  (export "div_u" (func $div_u))
  (export "rem_s" (func $rem_s))
  (export "rem_u" (func $rem_u))
  (export "popcnt" (func $popcnt))

  (global $high (mut i32) (i32.const 0))

  (func $get_high (result i32)
    (get_global $high)
  )

  ;; (func $f64_cast (param $f f64) (result i32)
  ;;   ;; f64 -> i64
  ;;   (local $result i64)
  ;;   (set_local $result
  ;;              (i64.reinterpret/f64 (get_local $f)) )
  ;;   (set_global $high
  ;;               (i32.wrap/i64
  ;;                 (i64.shr_s (get_local $result)
  ;;                            (i64.const 32) ) ) )
  ;;   (i32.wrap/i64 (get_local $result))
  ;; )

  ;; (func $cast_f64 (param $xl i32) (param $xh i32) (result f64)
  ;;   ;; i64 -> f64
  ;;   (f64.reinterpret/i64
  ;;     (i64.or
  ;;       (i64.extend_u/i32 (get_local $xl))
  ;;       (i64.shl (i64.extend_u/i32 (get_local $xh)) (i64.const 32))
  ;;     )
  ;;   )
  ;; )

  (func $popcnt (param $xl i32) (param $xh i32) (result i32)
    ;; (local $result i64)
    ;;
    ;; i32(popcnt((u64(xl) | (u64(xh) << 32))))
    ;;
    (i32.wrap/i64
      (i64.popcnt
        (i64.or
          (i64.extend_u/i32 (get_local $xl))
          (i64.shl
            (i64.extend_u/i32 (get_local $xh))
            (i64.const 32)
          )
        )
      )
    )
  )

  (func $mul (param $xl i32) (param $xh i32) (param $yl i32) (param $yh i32) (result i32)
    (local $result i64)
    ;;
    ;; result = (u64(xl) | (u64(xh) << 32)) * (u64(yl) | (u64(yh) << 32))
    ;; high = i32_wrap(result >> 32)
    ;; return i32_wrap(result)  // low
    ;;
    (set_local $result
      (i64.mul
        (i64.or
          (i64.extend_u/i32 (get_local $xl))
          (i64.shl
            (i64.extend_u/i32 (get_local $xh))
            (i64.const 32)
          )
        )
        (i64.or
          (i64.extend_u/i32 (get_local $yl))
          (i64.shl
            (i64.extend_u/i32 (get_local $yh))
            (i64.const 32)
          )
        )
      )
    )
    (set_global $high
      (i32.wrap/i64
        (i64.shr_s (get_local $result) (i64.const 32))
      )
    )
    (i32.wrap/i64 (get_local $result))
  )
  (func $div_s (param $xl i32) (param $xh i32) (param $yl i32) (param $yh i32) (result i32)
    (local $result i64)
    (set_local $result
      (i64.div_s
        (i64.or
          (i64.extend_u/i32 (get_local $xl))
          (i64.shl
            (i64.extend_u/i32 (get_local $xh))
            (i64.const 32)
          )
        )
        (i64.or
          (i64.extend_u/i32 (get_local $yl))
          (i64.shl
            (i64.extend_u/i32 (get_local $yh))
            (i64.const 32)
          )
        )
      )
    )
    (set_global $high
      (i32.wrap/i64
        (i64.shr_s
          (get_local $result)
          (i64.const 32)
        )
      )
    )
    (i32.wrap/i64
      (get_local $result)
    )
  )
  (func $div_u (param $xl i32) (param $xh i32) (param $yl i32) (param $yh i32) (result i32)
    (local $result i64)
    (set_local $result
      (i64.div_u
        (i64.or
          (i64.extend_u/i32
            (get_local $xl)
          )
          (i64.shl
            (i64.extend_u/i32
              (get_local $xh)
            )
            (i64.const 32)
          )
        )
        (i64.or
          (i64.extend_u/i32
            (get_local $yl)
          )
          (i64.shl
            (i64.extend_u/i32
              (get_local $yh)
            )
            (i64.const 32)
          )
        )
      )
    )
    (set_global $high
      (i32.wrap/i64
        (i64.shr_s
          (get_local $result)
          (i64.const 32)
        )
      )
    )
    (i32.wrap/i64
      (get_local $result)
    )
  )
  (func $rem_s (param $xl i32) (param $xh i32) (param $yl i32) (param $yh i32) (result i32)
    (local $result i64)
    (set_local $result
      (i64.rem_s
        (i64.or
          (i64.extend_u/i32
            (get_local $xl)
          )
          (i64.shl
            (i64.extend_u/i32
              (get_local $xh)
            )
            (i64.const 32)
          )
        )
        (i64.or
          (i64.extend_u/i32
            (get_local $yl)
          )
          (i64.shl
            (i64.extend_u/i32
              (get_local $yh)
            )
            (i64.const 32)
          )
        )
      )
    )
    (set_global $high
      (i32.wrap/i64
        (i64.shr_s
          (get_local $result)
          (i64.const 32)
        )
      )
    )
    (i32.wrap/i64
      (get_local $result)
    )
  )
  (func $rem_u (param $xl i32) (param $xh i32) (param $yl i32) (param $yh i32) (result i32)
    (local $result i64)
    (set_local $result
      (i64.rem_u
        (i64.or
          (i64.extend_u/i32
            (get_local $xl)
          )
          (i64.shl
            (i64.extend_u/i32
              (get_local $xh)
            )
            (i64.const 32)
          )
        )
        (i64.or
          (i64.extend_u/i32
            (get_local $yl)
          )
          (i64.shl
            (i64.extend_u/i32
              (get_local $yh)
            )
            (i64.const 32)
          )
        )
      )
    )
    (set_global $high
      (i32.wrap/i64
        (i64.shr_s
          (get_local $result)
          (i64.const 32)
        )
      )
    )
    (i32.wrap/i64
      (get_local $result)
    )
  )
)

