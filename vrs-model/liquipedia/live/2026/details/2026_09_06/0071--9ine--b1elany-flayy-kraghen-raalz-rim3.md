### Roster Details<br />
Team Name: 9INE<br />
Roster: b1elany, Flayy, kraghen, raalz, rim3<br />
Global Rank: [71](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [54]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  1071.4<br />
<br />
Final Rank Value (1071.4) = Starting Rank Value (1061.8) + Head To Head Adjustments (9.6)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.364[<sup>1</sup>](#table2)
- Bounty Collected: 0.359[<sup>2</sup>](#table1)
- Opponent Network: 0.080[<sup>2</sup>](#table1)
- LAN Wins: 0.589[<sup>2</sup>](#table1)

The average of these factors is 0.348<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 1061.8
- 400 + ( ( 0.348 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 1061.8


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.316
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent            | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                 |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           35 |       34 | 2026-09-05 | Metizport           | L   | 1.000      | -            | -                | -                | -         |   -15.03 | b1elany, Flayy, kraghen, raalz, rim3   |
|           34 |       82 | 2026-09-04 | Rune Eaters Esports | W   | 1.000      | 0.143        | 0.024 (0.003)    | 0.772 (0.110)    | -         |    14.55 | b1elany, Flayy, kraghen, raalz, rim3   |
|           33 |      125 | 2026-09-02 | Iberian Soul        | W   | 1.000      | 0.143        | 0.094 (0.013)    | 0.386 (0.055)    | -         |    18.89 | b1elany, Flayy, kraghen, raalz, rim3   |
|           32 |      307 | 2026-08-29 | G2 Ares             | W   | 1.000      | 0.143        | 0.014 (0.002)    | 0.689 (0.098)    | -         |     9.93 | b1elany, Flayy, kraghen, raalz, rim3   |
|           31 |      325 | 2026-08-29 | WOPA Esport         | W   | 1.000      | 0.143        | 0.013 (0.002)    | 0.294 (0.042)    | -         |    11.58 | b1elany, Flayy, kraghen, raalz, rim3   |
|           30 |      363 | 2026-08-28 | Rune Eaters Esports | L   | 1.000      | -            | -                | -                | -         |   -16.37 | b1elany, Flayy, kraghen, raalz, rim3   |
|           29 |      908 | 2026-08-09 | HOTU                | L   | 1.000      | -            | -                | -                | -         |    -4.36 | b1elany, Flayy, kraghen, raalz, St0m4k |
|           28 |      931 | 2026-08-08 | ABT Esports         | W   | 1.000      | 0.818        | -                | 0.039 (0.032)    | 1 (1.000) |     1.13 | b1elany, Flayy, kraghen, raalz, St0m4k |
|           27 |      996 | 2026-08-07 | HEROIC              | L   | 0.996      | -            | -                | -                | -         |    -4.73 | b1elany, Flayy, kraghen, raalz, St0m4k |
|           26 |     1018 | 2026-08-07 | ABT Esports         | W   | 0.995      | 0.818        | -                | 0.039 (0.032)    | 1 (0.995) |     1.04 | b1elany, Flayy, kraghen, raalz, St0m4k |
|           25 |     1078 | 2026-08-04 | Team Liquid         | L   | 0.976      | -            | -                | -                | -         |    -2.37 | b1elany, Flayy, kraghen, raalz, St0m4k |
|           24 |     1132 | 2026-08-02 | BRUTE               | W   | 0.964      | 0.450        | 0.007 (0.003)    | 0.413 (0.179)    | 1 (0.964) |    18.43 | b1elany, Flayy, kraghen, raalz, St0m4k |
|           23 |     1144 | 2026-08-02 | 6666 Esports        | W   | 0.963      | 0.450        | -                | 0.219 (0.095)    | 1 (0.963) |     4.71 | b1elany, Flayy, kraghen, raalz, St0m4k |
|           22 |     1151 | 2026-08-02 | BRUTE               | L   | 0.962      | -            | -                | -                | -         |   -11.09 | b1elany, Flayy, kraghen, raalz, St0m4k |
|           21 |     2026 | 2026-06-25 | IC Esports          | L   | 0.709      | -            | -                | -                | -         |    -2.05 | b1elany, cej0t, Flayy, raalz, St0m4k   |
|           20 |     2044 | 2026-06-24 | GamerLegion         | W   | 0.704      | 0.548        | 0.344 (0.133)    | 0.254 (0.098)    | 1 (0.704) |    19.50 | b1elany, cej0t, Flayy, raalz, St0m4k   |
|           19 |     2063 | 2026-06-23 | Sashi Esport        | L   | 0.696      | -            | -                | -                | -         |    -5.68 | b1elany, cej0t, Flayy, raalz, St0m4k   |
|           18 |     3370 | 2026-05-08 | Walczaki            | L   | 0.388      | -            | -                | -                | -         |    -5.86 | adamS, Flayy, kraghen, notineki, raalz |
|           17 |     3612 | 2026-04-30 | 33                  | L   | 0.335      | -            | -                | -                | -         |    -6.72 | adamS, bnox, Flayy, kraghen, raalz     |
|           16 |     3806 | 2026-04-26 | Iberian Soul        | L   | 0.309      | -            | -                | -                | -         |    -3.72 | bnox, cej0t, Flayy, kraghen, raalz     |
|           15 |     3882 | 2026-04-25 | HYPERSPIRIT         | W   | 0.302      | 0.435        | 0.002 (0.000)    | 0.426 (0.056)    | 1 (0.302) |     1.64 | bnox, cej0t, Flayy, kraghen, raalz     |
|           14 |     3930 | 2026-04-24 | Privateer Gaming    | L   | 0.296      | -            | -                | -                | -         |    -7.96 | bnox, cej0t, Flayy, kraghen, raalz     |
|           13 |     3945 | 2026-04-23 | Misa Esports        | L   | 0.291      | -            | -                | -                | -         |    -7.89 | bnox, cej0t, Flayy, kraghen, raalz     |
|           12 |     4550 | 2026-04-03 | BetBoom Team        | L   | 0.156      | -            | -                | -                | -         |    -0.47 | bnox, cej0t, Flayy, kraghen, raalz     |
|           11 |     4652 | 2026-04-02 | Iberian Soul        | W   | 0.149      | 0.500        | 0.094 (0.007)    | -                | 1 (0.149) |     2.85 | bnox, cej0t, Flayy, kraghen, raalz     |
|           10 |     4719 | 2026-04-01 | GamerLegion         | L   | 0.143      | -            | -                | -                | -         |    -0.63 | bnox, cej0t, Flayy, kraghen, raalz     |
|            9 |     5219 | 2026-03-25 | Luminosity Gaming   | L   | 0.096      | -            | -                | -                | -         |    -0.95 | bnox, cej0t, Flayy, kraghen, raalz     |
|            8 |     5240 | 2026-03-24 | OG                  | W   | 0.091      | 0.435        | 0.024 (0.001)    | -                | 1 (0.091) |     1.21 | bnox, cej0t, Flayy, kraghen, raalz     |
|            7 |     5261 | 2026-03-24 | IC Esports          | L   | 0.090      | -            | -                | -                | -         |    -0.18 | bnox, cej0t, Flayy, kraghen, raalz     |
|            6 |     5272 | 2026-03-24 | INFINITE Talent     | W   | 0.089      | -            | -                | -                | 1 (0.089) |     0.07 | bnox, cej0t, Flayy, kraghen, raalz     |
|            5 |     5758 | 2026-03-14 | Alliance            | L   | 0.024      | -            | -                | -                | -         |    -0.09 | bnox, cej0t, Flayy, kraghen, raalz     |
|            4 |     5876 | 2026-03-12 | Rebels Gaming       | W   | 0.010      | -            | -                | -                | 1 (0.010) |     0.07 | bnox, cej0t, Flayy, kraghen, raalz     |
|            3 |     5879 | 2026-03-12 | Nebula In Chaox     | W   | 0.009      | -            | -                | -                | -         |     0.01 | bnox, cej0t, Flayy, kraghen, raalz     |
|            2 |     5887 | 2026-03-12 | M80                 | L   | 0.009      | -            | -                | -                | -         |    -0.08 | bnox, cej0t, Flayy, kraghen, raalz     |
|            1 |     5888 | 2026-03-12 | JiJieHao            | W   | 0.009      | 0.349        | 0.070 (0.000)    | -                | -         |     0.24 | bnox, cej0t, Flayy, kraghen, raalz     |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($9,096.02)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.02) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-08-05 |      0.984 | $4,000.00      | $3,935.37       |
| 2026-06-28 |      0.731 | $2,500.00      | $1,826.62       |
| 2026-04-26 |      0.310 | $6,000.00      | $1,861.94       |
| 2026-04-04 |      0.164 | $9,000.00      | $1,472.08       |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
