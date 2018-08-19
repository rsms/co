(module
 (import "env" "memory" (memory $0 2 2))

 (export "bufptr" (func $bufptr))
 (export "bufsize" (func $bufsize))
 (export "fmtduration" (func $fmtduration))

 (func $bufptr (result i32)
  (i32.const 1024)
 )

 (func $bufsize (result i32)
  (i32.const 32)
 )

 (func $fmtduration (param $xl i32) (param $xh i32) (result i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i64)
  (local $4 i64)
  (local $5 i64)
  (local $6 i32)
  (local $7 i32)
  (local $8 i64)
  (local $9 i32)
  (local $10 i32)
  (local $11 i32)
  (local $12 i32)
  ;;@ fmtduration.c:115:0
  ;; (set_local $3
  ;;  (i64.trunc_s/f64
  ;;   (get_local $0)
  ;;  )
  ;; )

  (set_local $3
    (i64.or
      (i64.extend_u/i32 (get_local $xl))
      (i64.shl
        (i64.extend_u/i32 (get_local $xh))
        (i64.const 32)
      )
    )
  )

  ;;@ fmtduration.c:121:0
  (set_local $9
   (i64.lt_s
    (get_local $3)
    (i64.const 0)
   )
  )
  ;;@ fmtduration.c:122:0
  (set_local $5
   (i64.sub
    (i64.const 0)
    (get_local $3)
   )
  )
  (if
   ;;@ fmtduration.c:121:0
   (i32.eqz
    (get_local $9)
   )
   (set_local $5
    (get_local $3)
   )
  )
  ;;@ fmtduration.c:125:0
  (i32.store8
   (i32.const 1055)
   (i32.const 115)
  )
  (block $do-once
   (if
    (i64.lt_u
     (get_local $5)
     (i64.const 1000000000)
    )
    (block
     (if
      ;;@ fmtduration.c:132:0
      (i64.eq
       (get_local $5)
       (i64.const 0)
      )
      (block
       ;;@ fmtduration.c:133:0
       (i32.store8
        (i32.const 1054)
        (i32.const 48)
       )
       ;;@ fmtduration.c:185:0
       (return
        (i32.const 30)
       )
      )
     )
     (if
      ;;@ fmtduration.c:135:0
      (i64.lt_u
       (get_local $5)
       (i64.const 1000)
      )
      (block
       ;;@ fmtduration.c:138:0
       (i32.store8
        (i32.const 1054)
        (i32.const 110)
       )
       (set_local $1
        (i32.const 30)
       )
      )
      (block
       (set_local $1
        (if (result i32)
         ;;@ fmtduration.c:139:0
         (i64.lt_u
          (get_local $5)
          (i64.const 1000000)
         )
         (block (result i32)
          ;;@ fmtduration.c:143:0
          (i32.store8
           (i32.const 1054)
           (i32.const -75)
          )
          ;;@ fmtduration.c:144:0
          ;; (i32.store8
          ;;  (i32.const 1053)
          ;;  (i32.const -62)
          ;; )
          (set_local $10
           (i32.const 3)
          )
          ;; (i32.const 29)
          (i32.const 30)
         )
         (block (result i32)
          ;;@ fmtduration.c:148:0
          (i32.store8
           (i32.const 1054)
           (i32.const 109)
          )
          (set_local $10
           (i32.const 6)
          )
          (i32.const 30)
         )
        )
       )
       (set_local $3
        (get_local $5)
       )
       (loop $while-in
        ;;@ fmtduration.c:73:0
        (set_local $4
         (i64.sub
          (get_local $3)
          (i64.mul
           (tee_local $5
            (i64.div_u
             (get_local $3)
             (i64.const 10)
            )
           )
           (i64.const 10)
          )
         )
        )
        ;;@ fmtduration.c:68:0
        (set_local $7
         (i64.ne
          (get_local $4)
          (i64.const 0)
         )
        )
        (set_local $6
         (i32.or
          (get_local $6)
          (get_local $7)
         )
        )
        ;;@ fmtduration.c:69:0
        (set_local $11
         (i32.eqz
          (i32.and
           (get_local $6)
           (i32.const 255)
          )
         )
        )
        ;;@ fmtduration.c:70:0
        (set_local $7
         (i32.add
          (get_local $1)
          (i32.const -1)
         )
        )
        (if
         (i32.eqz
          (get_local $11)
         )
         (block
          ;;@ fmtduration.c:71:0
          (set_local $12
           (i32.add
            (get_local $7)
            (i32.const 1024)
           )
          )
          (set_local $1
           (i32.wrap/i64
            (get_local $4)
           )
          )
          (set_local $1
           (i32.or
            (get_local $1)
            (i32.const 48)
           )
          )
          (set_local $1
           (i32.and
            (get_local $1)
            (i32.const 255)
           )
          )
          (i32.store8
           (get_local $12)
           (get_local $1)
          )
          (set_local $1
           (get_local $7)
          )
         )
        )
        ;;@ fmtduration.c:66:0
        (set_local $2
         (i32.add
          (get_local $2)
          (i32.const 1)
         )
        )
        (if
         (i32.ne
          (get_local $2)
          (get_local $10)
         )
         (block
          (set_local $3
           (get_local $5)
          )
          (br $while-in)
         )
        )
       )
       ;;@ fmtduration.c:76:0
       (set_local $2
        (i32.add
         (get_local $1)
         (i32.const -1)
        )
       )
       (if
        (i32.eqz
         (get_local $11)
        )
        (block
         ;;@ fmtduration.c:77:0
         (set_local $1
          (i32.add
           (get_local $2)
           (i32.const 1024)
          )
         )
         (i32.store8
          (get_local $1)
          (i32.const 46)
         )
         (set_local $1
          (get_local $2)
         )
        )
       )
       (if
        ;;@ fmtduration.c:87:0
        (i64.lt_u
         (get_local $3)
         (i64.const 10)
        )
        (block
         ;;@ fmtduration.c:88:0
         (set_local $1
          (i32.add
           (get_local $1)
           (i32.const -1)
          )
         )
         ;;@ fmtduration.c:89:0
         (set_local $2
          (i32.add
           (get_local $1)
           (i32.const 1024)
          )
         )
         (i32.store8
          (get_local $2)
          (i32.const 48)
         )
         (br $do-once)
        )
       )
      )
     )
     (loop $while-in1
      ;;@ fmtduration.c:92:0
      (set_local $1
       (i32.add
        (get_local $1)
        (i32.const -1)
       )
      )
      ;;@ fmtduration.c:94:0
      (set_local $4
       (i64.sub
        (get_local $5)
        (i64.mul
         (tee_local $3
          (i64.div_u
           (get_local $5)
           (i64.const 10)
          )
         )
         (i64.const 10)
        )
       )
      )
      ;;@ fmtduration.c:93:0
      (set_local $2
       (i32.wrap/i64
        (get_local $4)
       )
      )
      (set_local $2
       (i32.or
        (get_local $2)
        (i32.const 48)
       )
      )
      (set_local $6
       (i32.and
        (get_local $2)
        (i32.const 255)
       )
      )
      (set_local $2
       (i32.add
        (get_local $1)
        (i32.const 1024)
       )
      )
      (i32.store8
       (get_local $2)
       (get_local $6)
      )
      (if
       ;;@ fmtduration.c:91:0
       (i64.ge_u
        (get_local $5)
        (i64.const 10)
       )
       (block
        (set_local $5
         (get_local $3)
        )
        (br $while-in1)
       )
      )
     )
    )
    (block
     ;;@ fmtduration.c:73:0
     (set_local $4
      (i64.sub
       (get_local $5)
       (i64.mul
        (tee_local $3
         (i64.div_u
          (get_local $5)
          (i64.const 10)
         )
        )
        (i64.const 10)
       )
      )
     )
     (set_local $6
      (if (result i32)
       ;;@ fmtduration.c:68:0
       (i64.eq
        (get_local $4)
        (i64.const 0)
       )
       (i32.const 31)
       (block (result i32)
        ;;@ fmtduration.c:71:0
        (set_local $1
         (i32.wrap/i64
          (get_local $4)
         )
        )
        (set_local $1
         (i32.or
          (get_local $1)
          (i32.const 48)
         )
        )
        (set_local $1
         (i32.and
          (get_local $1)
          (i32.const 255)
         )
        )
        (i32.store8
         (i32.const 1054)
         (get_local $1)
        )
        (i32.const 30)
       )
      )
     )
     ;;@ fmtduration.c:67:0
     (set_local $3
      (i64.rem_u
       (get_local $3)
       (i64.const 10)
      )
     )
     ;;@ fmtduration.c:68:0
     (set_local $4
      (i64.or
       (get_local $4)
       (get_local $3)
      )
     )
     (set_local $1
      (i64.eq
       (get_local $4)
       (i64.const 0)
      )
     )
     ;;@ fmtduration.c:70:0
     (set_local $2
      (i32.add
       (get_local $6)
       (i32.const -1)
      )
     )
     (if
      (get_local $1)
      (set_local $1
       (get_local $6)
      )
      (block
       ;;@ fmtduration.c:71:0
       (set_local $7
        (i32.add
         (get_local $2)
         (i32.const 1024)
        )
       )
       (set_local $1
        (i32.wrap/i64
         (get_local $3)
        )
       )
       (set_local $1
        (i32.or
         (get_local $1)
         (i32.const 48)
        )
       )
       (set_local $1
        (i32.and
         (get_local $1)
         (i32.const 255)
        )
       )
       (i32.store8
        (get_local $7)
        (get_local $1)
       )
       ;;@ fmtduration.c:70:0
       (set_local $1
        (get_local $2)
       )
       (set_local $2
        (i32.add
         (get_local $6)
         (i32.const -2)
        )
       )
      )
     )
     ;;@ fmtduration.c:73:0
     (set_local $3
      (i64.div_u
       (get_local $5)
       (i64.const 100)
      )
     )
     ;;@ fmtduration.c:67:0
     (set_local $3
      (i64.rem_u
       (get_local $3)
       (i64.const 10)
      )
     )
     ;;@ fmtduration.c:68:0
     (set_local $4
      (i64.or
       (get_local $4)
       (get_local $3)
      )
     )
     (if
      (i64.ne
       (get_local $4)
       (i64.const 0)
      )
      (block
       ;;@ fmtduration.c:71:0
       (set_local $6
        (i32.add
         (get_local $2)
         (i32.const 1024)
        )
       )
       (set_local $1
        (i32.wrap/i64
         (get_local $3)
        )
       )
       (set_local $1
        (i32.or
         (get_local $1)
         (i32.const 48)
        )
       )
       (set_local $1
        (i32.and
         (get_local $1)
         (i32.const 255)
        )
       )
       (i32.store8
        (get_local $6)
        (get_local $1)
       )
       ;;@ fmtduration.c:70:0
       (set_local $2
        (i32.add
         (tee_local $1
          (get_local $2)
         )
         (i32.const -1)
        )
       )
      )
     )
     ;;@ fmtduration.c:73:0
     (set_local $3
      (i64.div_u
       (get_local $5)
       (i64.const 1000)
      )
     )
     ;;@ fmtduration.c:67:0
     (set_local $3
      (i64.rem_u
       (get_local $3)
       (i64.const 10)
      )
     )
     ;;@ fmtduration.c:68:0
     (set_local $4
      (i64.or
       (get_local $4)
       (get_local $3)
      )
     )
     (if
      (i64.ne
       (get_local $4)
       (i64.const 0)
      )
      (block
       ;;@ fmtduration.c:71:0
       (set_local $6
        (i32.add
         (get_local $2)
         (i32.const 1024)
        )
       )
       (set_local $1
        (i32.wrap/i64
         (get_local $3)
        )
       )
       (set_local $1
        (i32.or
         (get_local $1)
         (i32.const 48)
        )
       )
       (set_local $1
        (i32.and
         (get_local $1)
         (i32.const 255)
        )
       )
       (i32.store8
        (get_local $6)
        (get_local $1)
       )
       ;;@ fmtduration.c:70:0
       (set_local $2
        (i32.add
         (tee_local $1
          (get_local $2)
         )
         (i32.const -1)
        )
       )
      )
     )
     ;;@ fmtduration.c:73:0
     (set_local $3
      (i64.div_u
       (get_local $5)
       (i64.const 10000)
      )
     )
     ;;@ fmtduration.c:67:0
     (set_local $3
      (i64.rem_u
       (get_local $3)
       (i64.const 10)
      )
     )
     ;;@ fmtduration.c:68:0
     (set_local $4
      (i64.or
       (get_local $4)
       (get_local $3)
      )
     )
     (if
      (i64.ne
       (get_local $4)
       (i64.const 0)
      )
      (block
       ;;@ fmtduration.c:71:0
       (set_local $6
        (i32.add
         (get_local $2)
         (i32.const 1024)
        )
       )
       (set_local $1
        (i32.wrap/i64
         (get_local $3)
        )
       )
       (set_local $1
        (i32.or
         (get_local $1)
         (i32.const 48)
        )
       )
       (set_local $1
        (i32.and
         (get_local $1)
         (i32.const 255)
        )
       )
       (i32.store8
        (get_local $6)
        (get_local $1)
       )
       ;;@ fmtduration.c:70:0
       (set_local $2
        (i32.add
         (tee_local $1
          (get_local $2)
         )
         (i32.const -1)
        )
       )
      )
     )
     ;;@ fmtduration.c:73:0
     (set_local $3
      (i64.div_u
       (get_local $5)
       (i64.const 100000)
      )
     )
     ;;@ fmtduration.c:67:0
     (set_local $3
      (i64.rem_u
       (get_local $3)
       (i64.const 10)
      )
     )
     ;;@ fmtduration.c:68:0
     (set_local $4
      (i64.or
       (get_local $4)
       (get_local $3)
      )
     )
     (if
      (i64.ne
       (get_local $4)
       (i64.const 0)
      )
      (block
       ;;@ fmtduration.c:71:0
       (set_local $6
        (i32.add
         (get_local $2)
         (i32.const 1024)
        )
       )
       (set_local $1
        (i32.wrap/i64
         (get_local $3)
        )
       )
       (set_local $1
        (i32.or
         (get_local $1)
         (i32.const 48)
        )
       )
       (set_local $1
        (i32.and
         (get_local $1)
         (i32.const 255)
        )
       )
       (i32.store8
        (get_local $6)
        (get_local $1)
       )
       ;;@ fmtduration.c:70:0
       (set_local $2
        (i32.add
         (tee_local $1
          (get_local $2)
         )
         (i32.const -1)
        )
       )
      )
     )
     ;;@ fmtduration.c:73:0
     (set_local $3
      (i64.div_u
       (get_local $5)
       (i64.const 1000000)
      )
     )
     ;;@ fmtduration.c:67:0
     (set_local $3
      (i64.rem_u
       (get_local $3)
       (i64.const 10)
      )
     )
     ;;@ fmtduration.c:68:0
     (set_local $4
      (i64.or
       (get_local $4)
       (get_local $3)
      )
     )
     (if
      (i64.ne
       (get_local $4)
       (i64.const 0)
      )
      (block
       ;;@ fmtduration.c:71:0
       (set_local $6
        (i32.add
         (get_local $2)
         (i32.const 1024)
        )
       )
       (set_local $1
        (i32.wrap/i64
         (get_local $3)
        )
       )
       (set_local $1
        (i32.or
         (get_local $1)
         (i32.const 48)
        )
       )
       (set_local $1
        (i32.and
         (get_local $1)
         (i32.const 255)
        )
       )
       (i32.store8
        (get_local $6)
        (get_local $1)
       )
       ;;@ fmtduration.c:70:0
       (set_local $2
        (i32.add
         (tee_local $1
          (get_local $2)
         )
         (i32.const -1)
        )
       )
      )
     )
     ;;@ fmtduration.c:73:0
     (set_local $3
      (i64.div_u
       (get_local $5)
       (i64.const 10000000)
      )
     )
     ;;@ fmtduration.c:67:0
     (set_local $3
      (i64.rem_u
       (get_local $3)
       (i64.const 10)
      )
     )
     ;;@ fmtduration.c:68:0
     (set_local $8
      (i64.or
       (get_local $4)
       (get_local $3)
      )
     )
     (if
      (i64.ne
       (get_local $8)
       (i64.const 0)
      )
      (block
       ;;@ fmtduration.c:71:0
       (set_local $6
        (i32.add
         (get_local $2)
         (i32.const 1024)
        )
       )
       (set_local $1
        (i32.wrap/i64
         (get_local $3)
        )
       )
       (set_local $1
        (i32.or
         (get_local $1)
         (i32.const 48)
        )
       )
       (set_local $1
        (i32.and
         (get_local $1)
         (i32.const 255)
        )
       )
       (i32.store8
        (get_local $6)
        (get_local $1)
       )
       ;;@ fmtduration.c:70:0
       (set_local $2
        (i32.add
         (tee_local $1
          (get_local $2)
         )
         (i32.const -1)
        )
       )
      )
     )
     ;;@ fmtduration.c:73:0
     (set_local $3
      (i64.div_u
       (get_local $5)
       (i64.const 100000000)
      )
     )
     ;;@ fmtduration.c:67:0
     (set_local $4
      (i64.rem_u
       (get_local $3)
       (i64.const 10)
      )
     )
     ;;@ fmtduration.c:68:0
     (set_local $3
      (i64.or
       (get_local $8)
       (get_local $4)
      )
     )
     (if
      (i64.ne
       (get_local $3)
       (i64.const 0)
      )
      (block
       ;;@ fmtduration.c:71:0
       (set_local $6
        (i32.add
         (get_local $2)
         (i32.const 1024)
        )
       )
       (set_local $1
        (i32.wrap/i64
         (get_local $4)
        )
       )
       (set_local $1
        (i32.or
         (get_local $1)
         (i32.const 48)
        )
       )
       (set_local $1
        (i32.and
         (get_local $1)
         (i32.const 255)
        )
       )
       (i32.store8
        (get_local $6)
        (get_local $1)
       )
       ;;@ fmtduration.c:76:0
       (set_local $1
        (i32.add
         (get_local $2)
         (i32.const -1)
        )
       )
       ;;@ fmtduration.c:77:0
       (set_local $2
        (i32.add
         (get_local $1)
         (i32.const 1024)
        )
       )
       (i32.store8
        (get_local $2)
        (i32.const 46)
       )
      )
     )
     ;;@ fmtduration.c:73:0
     (set_local $3
      (i64.div_u
       (get_local $5)
       (i64.const 1000000000)
      )
     )
     ;;@ fmtduration.c:159:0
     (set_local $3
      (i64.rem_u
       (get_local $3)
       (i64.const 60)
      )
     )
     (if
      ;;@ fmtduration.c:87:0
      (i64.eq
       (get_local $3)
       (i64.const 0)
      )
      (block
       ;;@ fmtduration.c:88:0
       (set_local $1
        (i32.add
         (get_local $1)
         (i32.const -1)
        )
       )
       ;;@ fmtduration.c:89:0
       (set_local $2
        (i32.add
         (get_local $1)
         (i32.const 1024)
        )
       )
       (i32.store8
        (get_local $2)
        (i32.const 48)
       )
      )
      (loop $while-in3
       ;;@ fmtduration.c:92:0
       (set_local $1
        (i32.add
         (get_local $1)
         (i32.const -1)
        )
       )
       ;;@ fmtduration.c:94:0
       (set_local $8
        (i64.sub
         (get_local $3)
         (i64.mul
          (tee_local $4
           (i64.div_u
            (get_local $3)
            (i64.const 10)
           )
          )
          (i64.const 10)
         )
        )
       )
       ;;@ fmtduration.c:93:0
       (set_local $2
        (i32.wrap/i64
         (get_local $8)
        )
       )
       (set_local $2
        (i32.or
         (get_local $2)
         (i32.const 48)
        )
       )
       (set_local $6
        (i32.and
         (get_local $2)
         (i32.const 255)
        )
       )
       (set_local $2
        (i32.add
         (get_local $1)
         (i32.const 1024)
        )
       )
       (i32.store8
        (get_local $2)
        (get_local $6)
       )
       (if
        ;;@ fmtduration.c:91:0
        (i64.ge_u
         (get_local $3)
         (i64.const 10)
        )
        (block
         (set_local $3
          (get_local $4)
         )
         (br $while-in3)
        )
       )
      )
     )
     (if
      ;;@ fmtduration.c:163:0
      (i64.gt_u
       (get_local $5)
       (i64.const 59999999999)
      )
      (block
       ;;@ fmtduration.c:160:0
       (set_local $3
        (i64.div_u
         (get_local $5)
         (i64.const 60000000000)
        )
       )
       ;;@ fmtduration.c:164:0
       (set_local $2
        (i32.add
         (get_local $1)
         (i32.const -1)
        )
       )
       ;;@ fmtduration.c:165:0
       (set_local $6
        (i32.add
         (get_local $2)
         (i32.const 1024)
        )
       )
       (i32.store8
        (get_local $6)
        (i32.const 109)
       )
       ;;@ fmtduration.c:166:0
       (set_local $3
        (i64.rem_u
         (get_local $3)
         (i64.const 60)
        )
       )
       (if
        ;;@ fmtduration.c:87:0
        (i64.eq
         (get_local $3)
         (i64.const 0)
        )
        (block
         ;;@ fmtduration.c:88:0
         (set_local $1
          (i32.add
           (get_local $1)
           (i32.const -2)
          )
         )
         ;;@ fmtduration.c:89:0
         (set_local $2
          (i32.add
           (get_local $1)
           (i32.const 1024)
          )
         )
         (i32.store8
          (get_local $2)
          (i32.const 48)
         )
        )
        (block
         (set_local $1
          (get_local $2)
         )
         (loop $while-in5
          ;;@ fmtduration.c:92:0
          (set_local $1
           (i32.add
            (get_local $1)
            (i32.const -1)
           )
          )
          ;;@ fmtduration.c:94:0
          (set_local $8
           (i64.sub
            (get_local $3)
            (i64.mul
             (tee_local $4
              (i64.div_u
               (get_local $3)
               (i64.const 10)
              )
             )
             (i64.const 10)
            )
           )
          )
          ;;@ fmtduration.c:93:0
          (set_local $2
           (i32.wrap/i64
            (get_local $8)
           )
          )
          (set_local $2
           (i32.or
            (get_local $2)
            (i32.const 48)
           )
          )
          (set_local $6
           (i32.and
            (get_local $2)
            (i32.const 255)
           )
          )
          (set_local $2
           (i32.add
            (get_local $1)
            (i32.const 1024)
           )
          )
          (i32.store8
           (get_local $2)
           (get_local $6)
          )
          (if
           ;;@ fmtduration.c:91:0
           (i64.ge_u
            (get_local $3)
            (i64.const 10)
           )
           (block
            (set_local $3
             (get_local $4)
            )
            (br $while-in5)
           )
          )
         )
        )
       )
       (if
        ;;@ fmtduration.c:171:0
        (i64.gt_u
         (get_local $5)
         (i64.const 3599999999999)
        )
        (block
         ;;@ fmtduration.c:167:0
         (set_local $5
          (i64.div_u
           (get_local $5)
           (i64.const 3600000000000)
          )
         )
         ;;@ fmtduration.c:172:0
         (set_local $1
          (i32.add
           (get_local $1)
           (i32.const -1)
          )
         )
         ;;@ fmtduration.c:173:0
         (set_local $2
          (i32.add
           (get_local $1)
           (i32.const 1024)
          )
         )
         (i32.store8
          (get_local $2)
          (i32.const 104)
         )
         (loop $while-in7
          ;;@ fmtduration.c:92:0
          (set_local $1
           (i32.add
            (get_local $1)
            (i32.const -1)
           )
          )
          ;;@ fmtduration.c:94:0
          (set_local $4
           (i64.sub
            (get_local $5)
            (i64.mul
             (tee_local $3
              (i64.div_u
               (get_local $5)
               (i64.const 10)
              )
             )
             (i64.const 10)
            )
           )
          )
          ;;@ fmtduration.c:93:0
          (set_local $2
           (i32.wrap/i64
            (get_local $4)
           )
          )
          (set_local $2
           (i32.or
            (get_local $2)
            (i32.const 48)
           )
          )
          (set_local $6
           (i32.and
            (get_local $2)
            (i32.const 255)
           )
          )
          (set_local $2
           (i32.add
            (get_local $1)
            (i32.const 1024)
           )
          )
          (i32.store8
           (get_local $2)
           (get_local $6)
          )
          (if
           ;;@ fmtduration.c:91:0
           (i64.ge_u
            (get_local $5)
            (i64.const 10)
           )
           (block
            (set_local $5
             (get_local $3)
            )
            (br $while-in7)
           )
          )
         )
        )
       )
      )
     )
    )
   )
  )
  (if
   ;;@ fmtduration.c:180:0
   (i32.eqz
    (get_local $9)
   )
   ;;@ fmtduration.c:185:0
   (return
    (get_local $1)
   )
  )
  (set_local $2
   (i32.add
    (get_local $1)
    (i32.const -1)
   )
  )
  ;;@ fmtduration.c:181:0
  (set_local $1
   (i32.add
    (get_local $2)
    (i32.const 1024)
   )
  )
  (i32.store8
   (get_local $1)
   (i32.const 45)
  )
  ;;@ fmtduration.c:185:0
  (get_local $2)
 ) 

)
