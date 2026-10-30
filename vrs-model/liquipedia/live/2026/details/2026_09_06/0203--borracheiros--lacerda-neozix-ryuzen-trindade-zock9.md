### Roster Details<br />
Team Name: BORRACHEIROS<br />
Roster: Lacerda, neozix, ryuzen, trindade, zock9<br />
Global Rank: [203](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Americas]( ../../standings_americas_2026_09_06.md)<br />
Regional Rank: [41]( ../../standings_americas_2026_09_06.md)<br />
<br />
Final Rank Value:  706.1<br />
<br />
Final Rank Value (706.1) = Starting Rank Value (689.3) + Head To Head Adjustments (16.8)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.242[<sup>1</sup>](#table2)
- Bounty Collected: 0.267[<sup>2</sup>](#table1)
- Opponent Network: 0.100[<sup>2</sup>](#table1)
- LAN Wins: 0.000[<sup>2</sup>](#table1)

The average of these factors is 0.152<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 689.3
- 400 + ( ( 0.152 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 689.3


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.433
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                  | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                   |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           36 |       56 | 2026-09-04 | Galorys                   | L   | 1.000      | -            | -                | -                | -         |    -5.77 | Lacerda, neozix, ryuzen, trindade, zock9 |
|           35 |      118 | 2026-09-02 | MANSÃO MAROMBA            | W   | 1.000      | -            | -                | -                | 0 (0.000) |     6.56 | Lacerda, neozix, ryuzen, trindade, zock9 |
|           34 |      165 | 2026-09-01 | Alka Esports              | L   | 1.000      | -            | -                | -                | -         |   -13.25 | Lacerda, neozix, ryuzen, trindade, zock9 |
|           33 |      230 | 2026-08-30 | Peladona                  | L   | 1.000      | -            | -                | -                | -         |   -16.66 | Lacerda, neozix, ryuzen, trindade, zock9 |
|           32 |      345 | 2026-08-28 | BESTIA Academy            | W   | 1.000      | 0.354        | -                | 0.420 (0.149)    | 0 (0.000) |    14.46 | Lacerda, neozix, ryuzen, trindade, zock9 |
|           31 |      444 | 2026-08-26 | MEIA NOITE                | L   | 1.000      | -            | -                | -                | -         |   -19.01 | fl4sh, Lacerda, neozix, trindade, zock9  |
|           30 |      492 | 2026-08-25 | Galorys                   | L   | 1.000      | -            | -                | -                | -         |    -8.42 | fl4sh, Lacerda, neozix, trindade, zock9  |
|           29 |      515 | 2026-08-25 | Wachoskys                 | W   | 1.000      | -            | -                | -                | 0 (0.000) |     3.97 | Lacerda, neozix, ryuzen, trindade, zock9 |
|           28 |      790 | 2026-08-14 | Galorys                   | L   | 1.000      | -            | -                | -                | -         |    -8.20 | Lacerda, neozix, nolkz, trindade, zock9  |
|           27 |      877 | 2026-08-10 | MEIA NOITE                | W   | 1.000      | 0.333        | -                | 0.379 (0.126)    | 0 (0.000) |    13.31 | Lacerda, neozix, nolkz, trindade, zock9  |
|           26 |      891 | 2026-08-09 | Alka Esports              | L   | 1.000      | -            | -                | -                | -         |   -15.35 | Lacerda, neozix, nolkz, trindade, zock9  |
|           25 |      923 | 2026-08-08 | UNO MILLE                 | W   | 1.000      | 0.333        | 0.014 (0.005)    | 0.331 (0.110)    | 0 (0.000) |    17.38 | Lacerda, neozix, nolkz, trindade, zock9  |
|           24 |     1029 | 2026-08-06 | Galorys                   | L   | 0.992      | -            | -                | -                | -         |    -8.20 | Lacerda, neozix, nolkz, trindade, zock9  |
|           23 |     1095 | 2026-08-03 | Keyd Stars                | W   | 0.971      | 0.333        | 0.011 (0.003)    | 0.468 (0.151)    | 0 (0.000) |    19.39 | Lacerda, neozix, nolkz, trindade, zock9  |
|           22 |     1405 | 2026-07-25 | ODDIK                     | L   | 0.909      | -            | -                | -                | -         |   -11.75 | Lacerda, neozix, nolkz, rainny, zock9    |
|           21 |     1445 | 2026-07-24 | Fake do Biru              | W   | 0.903      | 0.354        | 0.008 (0.003)    | 0.244 (0.078)    | 0 (0.000) |    15.78 | Lacerda, neozix, nolkz, rainny, zock9    |
|           20 |     1510 | 2026-07-21 | BESTIA Academy            | W   | 0.885      | 0.354        | -                | 0.420 (0.132)    | 0 (0.000) |    12.63 | Lacerda, neozix, nolkz, rainny, zock9    |
|           19 |     1549 | 2026-07-19 | Metanoia Wolves           | W   | 0.870      | 0.354        | 0.003 (0.001)    | 0.161 (0.050)    | 0 (0.000) |    10.85 | Lacerda, neozix, nolkz, rainny, zock9    |
|           18 |     1648 | 2026-07-16 | Despedidos                | W   | 0.852      | 0.354        | 0.002 (0.001)    | -                | 0 (0.000) |     9.83 | Lacerda, neozix, nolkz, rainny, zock9    |
|           17 |     1668 | 2026-07-15 | Alka Esports              | L   | 0.845      | -            | -                | -                | -         |   -12.31 | Lacerda, neozix, nolkz, rainny, zock9    |
|           16 |     1824 | 2026-07-06 | Fake do Biru              | L   | 0.785      | -            | -                | -                | -         |   -10.24 | neozix, nolkz, rainny, ryuzen, zock9     |
|           15 |     1848 | 2026-07-04 | Ex-MIBR Academy           | W   | 0.770      | 0.354        | 0.003 (0.001)    | 0.232 (0.063)    | -         |    12.58 | neozix, nolkz, rainny, ryuzen, zock9     |
|           14 |     1888 | 2026-07-02 | Metanoia Wolves           | W   | 0.756      | 0.354        | 0.003 (0.001)    | -                | -         |    11.51 | neozix, nolkz, rainny, ryuzen, zock9     |
|           13 |     1936 | 2026-06-29 | Despedidos                | W   | 0.738      | 0.354        | 0.002 (0.000)    | -                | -         |    10.08 | neozix, nolkz, rainny, ryuzen, zock9     |
|           12 |     1987 | 2026-06-27 | MEIA NOITE                | L   | 0.724      | -            | -                | -                | -         |   -12.04 | neozix, nolkz, rainny, ryuzen, zock9     |
|           11 |     2955 | 2026-05-21 | LargadosyPelados          | L   | 0.477      | -            | -                | -                | -         |    -2.93 | hug1, neozix, nolkz, ryuzen, zock9       |
|           10 |     2995 | 2026-05-20 | Sementes do Mal           | W   | 0.472      | -            | -                | -                | -         |     4.36 | hug1, neozix, nolkz, ryuzen, zock9       |
|            9 |     3045 | 2026-05-18 | UNO MILLE                 | L   | 0.459      | -            | -                | -                | -         |    -5.14 | hug1, neozix, nolkz, ryuzen, zock9       |
|            8 |     3048 | 2026-05-18 | Blitzkrieg (Mexican team) | W   | 0.458      | -            | -                | -                | -         |     3.78 | hug1, neozix, nolkz, ryuzen, zock9       |
|            7 |     3072 | 2026-05-17 | Isurus                    | L   | 0.451      | -            | -                | -                | -         |    -4.53 | hug1, neozix, nolkz, ryuzen, zock9       |
|            6 |     3092 | 2026-05-16 | PaiN Gaming Academy       | L   | 0.444      | -            | -                | -                | -         |    -7.56 | hug1, neozix, nolkz, ryuzen, zock9       |
|            5 |     3102 | 2026-05-16 | PaiN Gaming Academy       | W   | 0.443      | 0.333        | -                | 0.475 (0.070)    | -         |     6.55 | hug1, neozix, nolkz, ryuzen, zock9       |
|            4 |     3125 | 2026-05-15 | BESTIA Academy            | L   | 0.438      | -            | -                | -                | -         |    -7.53 | hug1, neozix, nolkz, ryuzen, zock9       |
|            3 |     3183 | 2026-05-13 | Bounty Hunters Esports    | L   | 0.424      | -            | -                | -                | -         |    -2.65 | hug1, neozix, nolkz, ryuzen, zock9       |
|            2 |     3191 | 2026-05-13 | Metanoia Wolves           | W   | 0.423      | 0.354        | 0.003 (0.000)    | -                | -         |     6.50 | hug1, neozix, nolkz, ryuzen, zock9       |
|            1 |     3252 | 2026-05-11 | Yawara E-Sports           | W   | 0.412      | 0.333        | 0.024 (0.003)    | 0.476 (0.065)    | -         |     8.89 | hug1, neozix, nolkz, ryuzen, zock9       |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($375.00)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-08-16 |      1.000 | $375.00        | $375.00         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
