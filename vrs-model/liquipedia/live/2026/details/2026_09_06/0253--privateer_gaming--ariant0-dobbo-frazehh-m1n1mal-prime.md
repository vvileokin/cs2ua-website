### Roster Details<br />
Team Name: Privateer Gaming<br />
Roster: Ariant0, dobbo, frazehh, M1n1maL, Prime<br />
Global Rank: [253](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [169]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  647.2<br />
<br />
Final Rank Value (647.2) = Starting Rank Value (760.6) + Head To Head Adjustments (-113.4)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.293[<sup>1</sup>](#table2)
- Bounty Collected: 0.237[<sup>2</sup>](#table1)
- Opponent Network: 0.035[<sup>2</sup>](#table1)
- LAN Wins: 0.194[<sup>2</sup>](#table1)

The average of these factors is 0.190<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 760.6
- 400 + ( ( 0.190 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 760.6


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.220
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                   |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           42 |      498 | 2026-08-25 | Ryvex                   | L   | 1.000      | -            | -                | -                | -         |   -15.79 | Ariant0, dobbo, frazehh, M1n1maL, Prime  |
|           41 |      629 | 2026-08-20 | The Last Resort         | L   | 1.000      | -            | -                | -                | -         |    -6.76 | Ariant0, dobbo, frazehh, M1n1maL, Prime  |
|           40 |      769 | 2026-08-15 | Phantom Esports Academy | L   | 1.000      | -            | -                | -                | -         |   -16.59 | Ariant0, dobbo, frazehh, M1n1maL, Prime  |
|           39 |      800 | 2026-08-14 | Fire Flux Esports       | L   | 1.000      | -            | -                | -                | -         |   -11.93 | Ariant0, dobbo, frazehh, M1n1maL, Prime  |
|           38 |      804 | 2026-08-14 | Eternal premium         | L   | 1.000      | -            | -                | -                | -         |   -18.84 | Ariant0, dobbo, frazehh, M1n1maL, Prime  |
|           37 |      816 | 2026-08-14 | OG                      | L   | 1.000      | -            | -                | -                | -         |    -5.29 | Ariant0, dobbo, frazehh, M1n1maL, Prime  |
|           36 |     1361 | 2026-07-26 | Honvéd Esport           | L   | 0.917      | -            | -                | -                | -         |   -10.08 | Ariant0, dobbo, frazehh, M1n1maL, Prime  |
|           35 |     1390 | 2026-07-25 | ROUNDS                  | W   | 0.911      | 0.344        | 0.000 (0.000)    | 0.222 (0.070)    | 0 (0.000) |    11.85 | Ariant0, dobbo, frazehh, M1n1maL, Prime  |
|           34 |     1436 | 2026-07-24 | Misa Esports            | L   | 0.904      | -            | -                | -                | -         |   -13.98 | Ariant0, dobbo, frazehh, M1n1maL, Prime  |
|           33 |     1470 | 2026-07-23 | Megoshort               | W   | 0.896      | 0.344        | 0.000 (0.000)    | -                | 0 (0.000) |     3.77 | Ariant0, dobbo, frazehh, M1n1maL, Prime  |
|           32 |     1561 | 2026-07-19 | The Last Resort         | L   | 0.869      | -            | -                | -                | -         |    -6.66 | dobbo, frazehh, JAUSTERE, M1n1maL, Prime |
|           31 |     1574 | 2026-07-19 | Glitchtech Esports      | W   | 0.868      | 0.315        | 0.001 (0.000)    | 0.067 (0.018)    | 1 (0.868) |    13.07 | dobbo, frazehh, JAUSTERE, M1n1maL, Prime |
|           30 |     1585 | 2026-07-18 | The Last Resort         | L   | 0.864      | -            | -                | -                | -         |    -6.62 | dobbo, frazehh, JAUSTERE, M1n1maL, Prime |
|           29 |     1593 | 2026-07-18 | Ryvex                   | W   | 0.862      | 0.315        | 0.001 (0.000)    | 0.136 (0.037)    | 1 (0.862) |    10.61 | dobbo, frazehh, JAUSTERE, M1n1maL, Prime |
|           28 |     2215 | 2026-06-13 | The Last Resort         | L   | 0.630      | -            | -                | -                | -         |    -4.87 | Ariant0, cryths, dobbo, frazehh, Prime   |
|           27 |     2600 | 2026-05-29 | Ryvex                   | W   | 0.531      | 0.265        | 0.001 (0.000)    | 0.136 (0.019)    | 0 (0.000) |     6.85 | Ariant0, dobbo, frazehh, Prime, robiin   |
|           26 |     2672 | 2026-05-28 | Vexar                   | L   | 0.522      | -            | -                | -                | -         |    -8.15 | Ariant0, dobbo, frazehh, Prime, robiin   |
|           25 |     2707 | 2026-05-27 | Bushido Wildcats        | W   | 0.516      | 0.303        | 0.017 (0.003)    | 1.000 (0.156)    | 0 (0.000) |    11.10 | Ariant0, dobbo, frazehh, Prime, robiin   |
|           24 |     2736 | 2026-05-26 | The Last Resort         | L   | 0.510      | -            | -                | -                | -         |    -3.92 | Ariant0, dobbo, frazehh, Prime, robiin   |
|           23 |     2781 | 2026-05-25 | ENJOY (Russian team)    | L   | 0.503      | -            | -                | -                | -         |    -7.09 | Ariant0, dobbo, frazehh, Prime, robiin   |
|           22 |     2828 | 2026-05-24 | Clair Obscur            | W   | 0.496      | 0.303        | 0.001 (0.000)    | 0.019 (0.003)    | 0 (0.000) |     5.59 | Ariant0, frazehh, Prime, robiin, Tadpole |
|           21 |     3400 | 2026-05-06 | M1x (Kosovar team)      | L   | 0.376      | -            | -                | -                | -         |    -9.02 | Ariant0, dobbo, frazehh, Prime, robiin   |
|           20 |     3419 | 2026-05-05 | Clutchain Female        | W   | 0.369      | 0.303        | 0.004 (0.000)    | 0.044 (0.005)    | 0 (0.000) |     4.53 | Ariant0, dobbo, frazehh, Prime, robiin   |
|           19 |     3461 | 2026-05-03 | NEW VISION              | L   | 0.356      | -            | -                | -                | -         |    -5.42 | Ariant0, dobbo, frazehh, Prime, robiin   |
|           18 |     3546 | 2026-05-01 | FC Famalicão Esports    | L   | 0.344      | -            | -                | -                | -         |    -8.58 | Ariant0, dobbo, frazehh, Prime, robiin   |
|           17 |     3609 | 2026-04-30 | EC BANGA                | W   | 0.336      | -            | -                | -                | 0 (0.000) |     1.29 | Ariant0, dobbo, frazehh, Prime, robiin   |
|           16 |     3649 | 2026-04-29 | ARGOS                   | L   | 0.330      | -            | -                | -                | -         |    -2.46 | Ariant0, dobbo, frazehh, Prime, robiin   |
|           15 |     3876 | 2026-04-25 | NNP                     | L   | 0.303      | -            | -                | -                | -         |    -6.26 | Ariant0, frazehh, Prime, robiin, Tadpole |
|           14 |     3930 | 2026-04-24 | 9INE                    | W   | 0.296      | 0.384        | 0.018 (0.002)    | 0.316 (0.036)    | 0 (0.000) |     7.96 | Ariant0, dobbo, frazehh, Prime, robiin   |
|           13 |     3997 | 2026-04-22 | UPGRADE Team            | L   | 0.283      | -            | -                | -                | -         |    -1.34 | Ariant0, dobbo, frazehh, Prime, robiin   |
|           12 |     4020 | 2026-04-20 | Young Ninjas            | L   | 0.269      | -            | -                | -                | -         |    -5.31 | Ariant0, dobbo, frazehh, Prime, robiin   |
|           11 |     4065 | 2026-04-18 | Playersclub             | L   | 0.256      | -            | -                | -                | -         |    -6.52 | Ariant0, dobbo, frazehh, Prime, robiin   |
|           10 |     4627 | 2026-04-02 | Yngods                  | L   | 0.151      | -            | -                | -                | -         |    -3.75 | Ariant0, dobbo, frazehh, Prime, Tadpole  |
|            9 |     4715 | 2026-04-01 | Johnny Speeds           | L   | 0.144      | -            | -                | -                | -         |    -1.61 | Ariant0, dobbo, frazehh, Prime, Tadpole  |
|            8 |     4910 | 2026-03-30 | Clutchain Female        | W   | 0.129      | 0.384        | 0.004 (0.000)    | 0.044 (0.002)    | -         |     1.54 | Ariant0, dobbo, frazehh, Prime, Tadpole  |
|            7 |     5112 | 2026-03-27 | Bebop                   | L   | 0.111      | -            | -                | -                | -         |    -1.79 | Ariant0, dobbo, frazehh, Prime, Tadpole  |
|            6 |     5169 | 2026-03-26 | EC BANGA                | W   | 0.102      | -            | -                | -                | -         |     0.38 | Ariant0, dobbo, frazehh, Prime, Tadpole  |
|            5 |     5205 | 2026-03-25 | Bebop                   | L   | 0.097      | -            | -                | -                | -         |    -1.55 | Ariant0, dobbo, frazehh, Prime, Tadpole  |
|            4 |     5436 | 2026-03-21 | Cirahvi                 | L   | 0.071      | -            | -                | -                | -         |    -1.51 | dobbo, frazehh, Prime, Tadpole, wfn      |
|            3 |     5522 | 2026-03-20 | FUZOS                   | W   | 0.062      | 0.384        | -                | 0.001 (0.000)    | -         |     0.23 | dobbo, frazehh, Prime, Tadpole, wfn      |
|            2 |     5653 | 2026-03-17 | EC BANGA                | W   | 0.043      | -            | -                | -                | -         |     0.16 | dobbo, frazehh, Prime, Tadpole, wfn      |
|            1 |     5686 | 2026-03-16 | Bebop                   | L   | 0.037      | -            | -                | -                | -         |    -0.60 | dobbo, frazehh, Prime, Tadpole, wfn      |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($1,960.71)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-07-19 |      0.869 | $1,478.78      | $1,285.24       |
| 2026-06-13 |      0.630 | $1,072.72      | $675.47         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
