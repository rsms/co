;; 
;; Version of xorshift128+ used in v8
;; http://vigna.di.unimi.it/ftp/papers/xorshiftplus.pdf
;; https://v8project.blogspot.com/2015/12/theres-mathrandom-and-then-theres.html
;; 
;; Run `node misc/gen-wasm.js` if you update this file
;;
(module
  (export "get_high" (func $get_high))
  (export "seed" (func $seed))
  (export "xorshift128plus" (func $xorshift128plus))

  (global $state0 (mut i64) (i64.const 1))
  (global $state1 (mut i64) (i64.const 2))
  (global $high (mut i32) (i32.const 0))

  (func $get_high (result i32)
    (get_global $high)
  )

  (func $seed (param $a i32)
    (set_global $state0
      (i64.extend_u/i32 (get_local $a)))
    (set_global $state1
      (i64.add
        (i64.extend_u/i32 (get_local $a))
        (i64.const 1)))
  )

  (func $xorshift128plus (result i32)
    (local $0 i64)
    (local $1 i64)
    (local $2 i64)
    (local $3 i64)
    ;; uint64_t s1 = state0;
    ;; uint64_t s0 = state1;
    (set_local $0 (get_global $state0))
    (set_local $1 (get_global $state1))
    ;; state0 = s0;
    (set_global $state0 (get_local $1))

    ;; s1 = s1 ^ (s1 << 23);
    (set_local $2 (i64.shl (get_local $0) (i64.const 23)))
    (set_local $0 (i64.xor (get_local $2) (get_local $0)))

    ;; s1 = s1 ^ (s1 >> 17);
    (set_local $2 (i64.shr_u (get_local $0) (i64.const 17)))
    
    ;; s1 = s1 ^ (s0 >> 26);
    (set_local $3 (i64.shr_u (get_local $1) (i64.const 26)))

    ;; s1 = s1 ^ (s1 >> 17); -- $0 = $0 ^ $1
    (set_local $0 (i64.xor (get_local $0) (get_local $1)))

    ;;@ xorshift128plus.c:16:0 -- $0 = $0 ^ $3
    (set_local $0 (i64.xor (get_local $0) (get_local $3)))

    ;;@ xorshift128plus.c:17:0 -- $0 = $0 ^ $2
    (set_local $0 (i64.xor (get_local $0) (get_local $2)))

    ;; state1 = s1;
    (set_global $state1 (get_local $0))

    ;; state0 + state1
    (set_local $1 (i64.add (get_local $0) (get_local $1)))

    (set_global $high
      (i32.wrap/i64
        (i64.shr_s (get_local $1) (i64.const 32))
      )
    )
    (i32.wrap/i64 (get_local $1))
  )

)
