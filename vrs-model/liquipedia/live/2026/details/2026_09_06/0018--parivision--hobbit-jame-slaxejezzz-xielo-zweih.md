### Roster Details<br />
Team Name: PARIVISION<br />
Roster: HObbit, Jame, slaxejezzz, xiELO, zweih<br />
Global Rank: [18](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [14]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  1463.7<br />
<br />
Final Rank Value (1463.7) = Starting Rank Value (1471.3) + Head To Head Adjustments (-7.5)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.713[<sup>1</sup>](#table2)
- Bounty Collected: 0.555[<sup>2</sup>](#table1)
- Opponent Network: 0.266[<sup>2</sup>](#table1)
- LAN Wins: 0.720[<sup>2</sup>](#table1)

The average of these factors is 0.563<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 1471.3
- 400 + ( ( 0.563 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 1471.3


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.254
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent           | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                 |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           32 |      744 | 2026-08-16 | MOUZ               | L   | 1.000      | -            | -                | -                | -         |    -2.70 | FL1T, Jame, slaxejezzz, xiELO, zweih   |
|           31 |      792 | 2026-08-14 | 100 Thieves        | W   | 1.000      | 1.000        | 0.150 (0.150)    | 0.590 (0.590)    | 1 (1.000) |    12.11 | FL1T, Jame, slaxejezzz, xiELO, zweih   |
|           30 |      858 | 2026-08-12 | B8                 | L   | 1.000      | -            | -                | -                | -         |   -16.21 | FL1T, Jame, slaxejezzz, xiELO, zweih   |
|           29 |     1745 | 2026-07-12 | 9z Team            | L   | 0.821      | -            | -                | -                | -         |    -7.07 | HObbit, Jame, slaxejezzz, xiELO, zweih |
|           28 |     1756 | 2026-07-11 | FaZe Clan          | W   | 0.816      | 1.000        | 0.478 (0.390)    | 0.357 (0.292)    | 1 (0.816) |    16.05 | HObbit, Jame, slaxejezzz, xiELO, zweih |
|           27 |     1777 | 2026-07-10 | BIG                | W   | 0.808      | 1.000        | 0.151 (0.122)    | 0.572 (0.462)    | 1 (0.808) |    14.73 | HObbit, Jame, slaxejezzz, xiELO, zweih |
|           26 |     1857 | 2026-07-03 | MIBR               | W   | 0.767      | 1.000        | 0.209 (0.160)    | 0.458 (0.352)    | 1 (0.767) |    12.52 | HObbit, Jame, slaxejezzz, xiELO, zweih |
|           25 |     1873 | 2026-07-03 | Lynn Vision Gaming | W   | 0.761      | 1.000        | 0.205 (0.156)    | 0.332 (0.252)    | 1 (0.761) |     8.01 | HObbit, Jame, slaxejezzz, xiELO, zweih |
|           24 |     1889 | 2026-07-02 | TYLOO              | L   | 0.756      | -            | -                | -                | -         |   -14.04 | HObbit, Jame, slaxejezzz, xiELO, zweih |
|           23 |     1907 | 2026-07-01 | Alliance           | W   | 0.750      | 1.000        | 0.210 (0.157)    | 0.449 (0.336)    | 1 (0.750) |    10.37 | HObbit, Jame, slaxejezzz, xiELO, zweih |
|           22 |     2209 | 2026-06-13 | Legacy             | L   | 0.630      | -            | -                | -                | -         |    -2.52 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|           21 |     2268 | 2026-06-12 | Luminosity Gaming  | L   | 0.622      | -            | -                | -                | -         |   -14.13 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|           20 |     2294 | 2026-06-11 | 9z Team            | L   | 0.615      | -            | -                | -                | -         |    -4.46 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|           19 |     2937 | 2026-05-21 | The MongolZ        | L   | 0.481      | -            | -                | -                | -         |    -7.82 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|           18 |     2970 | 2026-05-21 | Lynn Vision Gaming | W   | 0.476      | 1.000        | 0.205 (0.098)    | 0.332 (0.158)    | 1 (0.476) |     4.67 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|           17 |     3017 | 2026-05-20 | MIBR               | L   | 0.468      | -            | -                | -                | -         |    -8.26 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|           16 |     3024 | 2026-05-19 | Team Liquid        | W   | 0.467      | -            | -                | -                | 1 (0.467) |     0.16 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|           15 |     3234 | 2026-05-12 | G2 Esports         | L   | 0.416      | -            | -                | -                | -         |    -2.57 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|           14 |     3286 | 2026-05-10 | Aurora Gaming      | L   | 0.407      | -            | -                | -                | -         |    -5.28 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|           13 |     3315 | 2026-05-10 | Fisher College     | W   | 0.402      | -            | -                | -                | 1 (0.402) |     0.32 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|           12 |     3340 | 2026-05-09 | 9z Team            | L   | 0.396      | -            | -                | -                | -         |    -3.11 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|           11 |     4240 | 2026-04-09 | The MongolZ        | L   | 0.197      | -            | -                | -                | -         |    -3.56 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|           10 |     4270 | 2026-04-08 | Wildcard           | W   | 0.189      | -            | -                | -                | 1 (0.189) |     0.66 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|            9 |     4303 | 2026-04-07 | 3DMAX              | L   | 0.182      | -            | -                | -                | -         |    -4.22 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|            8 |     4332 | 2026-04-06 | FUT Esports        | L   | 0.177      | -            | -                | -                | -         |    -0.43 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|            7 |     4392 | 2026-04-05 | FOKUS              | W   | 0.169      | 1.000        | -                | 0.527 (0.089)    | -         |     1.00 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|            6 |     4452 | 2026-04-04 | Legacy             | W   | 0.163      | 1.000        | 1.000 (0.163)    | 0.457 (0.075)    | -         |     4.55 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|            5 |     5052 | 2026-03-28 | Natus Vincere      | L   | 0.117      | -            | -                | -                | -         |    -1.41 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|            4 |     5117 | 2026-03-27 | Team Falcons       | W   | 0.110      | 1.000        | 1.000 (0.110)    | -                | -         |     3.19 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|            3 |     5326 | 2026-03-23 | Team Vitality      | L   | 0.084      | -            | -                | -                | -         |    -0.24 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|            2 |     5432 | 2026-03-21 | Team Spirit        | W   | 0.071      | 1.000        | 1.000 (0.071)    | 0.730 (0.052)    | -         |     2.13 | BELCHONOKK, Jame, nota, xiELO, zweih   |
|            1 |     5567 | 2026-03-19 | Ninjas in Pyjamas  | W   | 0.055      | -            | -                | -                | -         |     0.02 | BELCHONOKK, Jame, nota, xiELO, zweih   |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($201,390.63)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.40) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-08-23 |      1.000 | $20,000.00     | $20,000.00      |
| 2026-07-12 |      0.821 | $140,000.00    | $114,987.96     |
| 2026-06-21 |      0.683 | $20,000.00     | $13,665.74      |
| 2026-05-23 |      0.494 | $30,000.00     | $14,825.69      |
| 2026-05-17 |      0.449 | $24,000.00     | $10,772.22      |
| 2026-04-11 |      0.210 | $62,500.00     | $13,104.75      |
| 2026-03-29 |      0.122 | $115,000.00    | $14,034.26      |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
