

```
IF({Rōpū Email}, 
  TRIM({Rōpū Email}),

IF(FIND(',',ARRAYJOIN({Champion Email}))>0,
  TRIM(LEFT(ARRAYJOIN({Champion Email}), 
    FIND(',',ARRAYJOIN({Champion Email}))-1
  )),

IF(FIND(',',
  ARRAYJOIN({Email - Primary (from People)}))>0,
    TRIM(LEFT(ARRAYJOIN({Email - Primary (from People)}),
      FIND(',',ARRAYJOIN({Email - Primary (from People)}))-1
)),

IF({Champion Email},
  TRIM(ARRAYJOIN({Champion Email})),

IF({Email - Primary (from People)},
  TRIM(ARRAYJOIN({Email - Primary (from People)})),
  ''

)))))
```
