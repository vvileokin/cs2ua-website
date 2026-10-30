### Roster Details<br />
Team Name: UNO MILLE<br />
Roster: ALLE, cLd, drg, pancc, rem1x<br />
Global Rank: [176](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Americas]( ../../standings_americas_2026_09_06.md)<br />
Regional Rank: [37]( ../../standings_americas_2026_09_06.md)<br />
<br />
Final Rank Value:  739.9<br />
<br />
Final Rank Value (739.9) = Starting Rank Value (765.9) + Head To Head Adjustments (-26.0)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.351[<sup>1</sup>](#table2)
- Bounty Collected: 0.310[<sup>2</sup>](#table1)
- Opponent Network: 0.109[<sup>2</sup>](#table1)
- LAN Wins: 0.000[<sup>2</sup>](#table1)

The average of these factors is 0.192<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 765.9
- 400 + ( ( 0.192 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 765.9


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.331
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent               | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                               |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           34 |       55 | 2026-09-04 | Alka Esports           | L   | 1.000      | -            | -                | -                | -         |   -14.18 | ALLE, drg, pazini, rem1x, ruan pablo |
|           33 |      883 | 2026-08-09 | PaiN Gaming Academy    | L   | 1.000      | -            | -                | -                | -         |   -20.07 | ALLE, cLd, drg, pancc, rem1x         |
|           32 |      923 | 2026-08-08 | BORRACHEIROS           | L   | 1.000      | -            | -                | -                | -         |   -17.38 | ALLE, cLd, drg, pancc, rem1x         |
|           31 |     1050 | 2026-08-05 | ODDIK Academy          | W   | 0.984      | -            | -                | -                | 0 (0.000) |     3.08 | ALLE, cLd, drg, pancc, rem1x         |
|           30 |     1076 | 2026-08-04 | Alka Esports           | L   | 0.977      | -            | -                | -                | -         |   -18.21 | ALLE, cLd, drg, pancc, rem1x         |
|           29 |     1395 | 2026-07-25 | LargadosyPelados       | L   | 0.910      | -            | -                | -                | -         |    -7.92 | ALLE, cLd, drg, pancc, rem1x         |
|           28 |     1474 | 2026-07-23 | MEIA NOITE             | W   | 0.896      | 0.354        | -                | 0.379 (0.120)    | 0 (0.000) |    10.27 | ALLE, cLd, drg, pancc, rem1x         |
|           27 |     1768 | 2026-07-10 | Fake do Biru           | L   | 0.811      | -            | -                | -                | -         |   -14.19 | ALLE, cLd, drg, pancc, rem1x         |
|           26 |     1788 | 2026-07-09 | PaiN Gaming Academy    | W   | 0.804      | 0.371        | 0.001 (0.000)    | 0.475 (0.142)    | 0 (0.000) |     8.00 | ALLE, cLd, drg, pancc, rem1x         |
|           25 |     1813 | 2026-07-08 | Isurus                 | L   | 0.796      | -            | -                | -                | -         |   -12.54 | ALLE, cLd, drg, pancc, rem1x         |
|           24 |     1818 | 2026-07-07 | Peladona               | L   | 0.791      | -            | -                | -                | -         |   -18.86 | ALLE, cLd, drg, pancc, rem1x         |
|           23 |     1954 | 2026-06-28 | ShindeN                | L   | 0.732      | -            | -                | -                | -         |    -9.02 | ALLE, cLd, drg, pancc, rem1x         |
|           22 |     1960 | 2026-06-28 | Fluxo W7M              | W   | 0.731      | 0.371        | 0.065 (0.018)    | 0.487 (0.132)    | 0 (0.000) |    19.31 | ALLE, cLd, drg, pancc, rem1x         |
|           21 |     1988 | 2026-06-27 | Bounty Hunters Esports | W   | 0.724      | 0.371        | 0.039 (0.010)    | 0.480 (0.129)    | 0 (0.000) |    14.94 | ALLE, cLd, drg, pancc, rem1x         |
|           20 |     2021 | 2026-06-25 | Keyd Stars             | W   | 0.710      | 0.371        | 0.011 (0.003)    | 0.468 (0.123)    | 0 (0.000) |    11.78 | ALLE, cLd, drg, pancc, rem1x         |
|           19 |     2040 | 2026-06-24 | MEIA NOITE             | W   | 0.705      | 0.371        | -                | 0.379 (0.099)    | 0 (0.000) |     7.26 | ALLE, cLd, drg, pancc, rem1x         |
|           18 |     2559 | 2026-05-30 | Yawara E-Sports        | L   | 0.537      | -            | -                | -                | -         |    -7.92 | ALLE, cLd, drg, pancc, rem1x         |
|           17 |     2816 | 2026-05-24 | LargadosyPelados       | L   | 0.497      | -            | -                | -                | -         |    -4.64 | ALLE, cLd, drg, Ltz, rem1x           |
|           16 |     2871 | 2026-05-23 | Galorys                | W   | 0.489      | 0.354        | 0.031 (0.005)    | 0.465 (0.081)    | 0 (0.000) |    10.36 | ALLE, cLd, drg, Ltz, rem1x           |
|           15 |     2898 | 2026-05-22 | Alka Esports           | W   | 0.485      | 0.354        | 0.007 (0.001)    | -                | 0 (0.000) |     6.36 | ALLE, cLd, drg, Ltz, rem1x           |
|           14 |     2941 | 2026-05-21 | Fake do Biru           | L   | 0.479      | -            | -                | -                | -         |    -7.99 | ALLE, cLd, drg, Ltz, rem1x           |
|           13 |     3045 | 2026-05-18 | BORRACHEIROS           | W   | 0.459      | -            | -                | -                | 0 (0.000) |     5.14 | ALLE, cLd, drg, Ltz, rem1x           |
|           12 |     3063 | 2026-05-17 | Guará eSports          | W   | 0.452      | -            | -                | -                | -         |     2.62 | ALLE, cLd, drg, Ltz, rem1x           |
|           11 |     3088 | 2026-05-16 | Yawara E-Sports        | L   | 0.446      | -            | -                | -                | -         |    -6.48 | ALLE, cLd, drg, Ltz, rem1x           |
|           10 |     3171 | 2026-05-13 | Galorys                | L   | 0.426      | -            | -                | -                | -         |    -4.39 | ALLE, cLd, drg, Ltz, rem1x           |
|            9 |     3210 | 2026-05-12 | PaiN Gaming Academy    | W   | 0.419      | -            | -                | -                | -         |     4.30 | ALLE, cLd, drg, Ltz, rem1x           |
|            8 |     3291 | 2026-05-10 | Galorys                | W   | 0.405      | 0.398        | 0.031 (0.005)    | 0.465 (0.075)    | -         |     8.94 | ALLE, cLd, drg, pancc, rem1x         |
|            7 |     3329 | 2026-05-09 | Imperial Esports       | W   | 0.398      | 0.398        | 0.080 (0.013)    | 0.585 (0.093)    | -         |    10.11 | ALLE, cLd, drg, pancc, rem1x         |
|            6 |     3359 | 2026-05-08 | LargadosyPelados       | L   | 0.390      | -            | -                | -                | -         |    -4.00 | ALLE, cLd, drg, Ltz, rem1x           |
|            5 |     3411 | 2026-05-05 | Isurus                 | W   | 0.370      | 0.354        | 0.026 (0.003)    | 0.705 (0.092)    | -         |     6.43 | ALLE, cLd, drg, Ltz, rem1x           |
|            4 |     3450 | 2026-05-03 | Keyd Stars             | W   | 0.358      | 0.398        | 0.011 (0.002)    | -                | -         |     6.16 | ALLE, cLd, drg, pancc, rem1x         |
|            3 |     3481 | 2026-05-02 | QUINTESSÊNCIA          | W   | 0.352      | -            | -                | -                | -         |     1.83 | ALLE, cLd, drg, pancc, rem1x         |
|            2 |     3532 | 2026-05-01 | Zetta Games            | W   | 0.345      | -            | -                | -                | -         |     1.89 | ALLE, cLd, drg, Ltz, rem1x           |
|            1 |     3628 | 2026-04-29 | Crashers               | W   | 0.332      | -            | -                | -                | -         |     3.01 | ALLE, cLd, drg, Ltz, rem1x           |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($7,188.70)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.01) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-06-28 |      0.732 | $4,000.00      | $2,929.81       |
| 2026-05-30 |      0.537 | $5,955.00      | $3,199.71       |
| 2026-05-24 |      0.499 | $375.00        | $187.17         |
| 2026-05-24 |      0.498 | $1,750.00      | $872.00         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
