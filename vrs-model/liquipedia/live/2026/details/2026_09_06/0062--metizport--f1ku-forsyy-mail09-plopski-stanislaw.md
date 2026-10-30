### Roster Details<br />
Team Name: Metizport<br />
Roster: F1KU, forsyy, MaiL09, Plopski, stanislaw<br />
Global Rank: [62](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [47]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  1102.8<br />
<br />
Final Rank Value (1102.8) = Starting Rank Value (1077.5) + Head To Head Adjustments (25.3)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.372[<sup>1</sup>](#table2)
- Bounty Collected: 0.318[<sup>2</sup>](#table1)
- Opponent Network: 0.161[<sup>2</sup>](#table1)
- LAN Wins: 0.574[<sup>2</sup>](#table1)

The average of these factors is 0.356<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 1077.5
- 400 + ( ( 0.356 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 1077.5


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.586
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                  | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                   |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           39 |       34 | 2026-09-05 | 9INE                      | W   | 1.000      | 0.143        | 0.018 (0.003)    | -                | 0 (0.000) |    15.03 | F1KU, forsyy, MaiL09, Plopski, stanislaw |
|           38 |       69 | 2026-09-04 | Sashi Esport              | W   | 1.000      | 0.143        | 0.055 (0.008)    | 0.625 (0.089)    | -         |    21.50 | F1KU, forsyy, MaiL09, Plopski, stanislaw |
|           37 |      132 | 2026-09-02 | Walczaki                  | W   | 1.000      | 0.143        | 0.064 (0.009)    | 0.799 (0.114)    | -         |    12.61 | F1KU, forsyy, MaiL09, Plopski, stanislaw |
|           36 |      160 | 2026-09-01 | WRAITH PCIFIC             | W   | 1.000      | -            | -                | -                | -         |     7.13 | F1KU, forsyy, MaiL09, Plopski, stanislaw |
|           35 |      191 | 2026-08-31 | ASTRAL Esports            | L   | 1.000      | -            | -                | -                | -         |   -16.65 | F1KU, forsyy, MaiL09, Plopski, stanislaw |
|           34 |      214 | 2026-08-31 | WRAITH PCIFIC             | W   | 1.000      | -            | -                | -                | -         |     6.31 | F1KU, forsyy, MaiL09, Plopski, stanislaw |
|           33 |      374 | 2026-08-28 | Bushido Wildcats          | L   | 1.000      | -            | -                | -                | -         |   -20.25 | F1KU, forsyy, MaiL09, Plopski, stanislaw |
|           32 |      631 | 2026-08-20 | OG                        | W   | 1.000      | 0.317        | 0.024 (0.008)    | 0.442 (0.140)    | -         |    13.69 | F1KU, forsyy, MaiL09, Plopski, stanislaw |
|           31 |      641 | 2026-08-20 | Color                     | W   | 1.000      | 0.317        | 0.053 (0.017)    | 0.827 (0.262)    | -         |    14.98 | F1KU, forsyy, MaiL09, Plopski, stanislaw |
|           30 |      654 | 2026-08-19 | Fire Flux Esports         | W   | 1.000      | 0.317        | 0.010 (0.003)    | 0.354 (0.112)    | -         |     5.76 | F1KU, forsyy, MaiL09, Plopski, stanislaw |
|           29 |      682 | 2026-08-18 | SPARTA Esports            | W   | 1.000      | 0.317        | 0.011 (0.003)    | 0.907 (0.288)    | -         |    10.14 | F1KU, forsyy, MaiL09, Plopski, stanislaw |
|           28 |      695 | 2026-08-18 | DONSTU Esports            | W   | 1.000      | 0.317        | -                | 0.453 (0.144)    | -         |     5.07 | F1KU, forsyy, MaiL09, Plopski, stanislaw |
|           27 |      943 | 2026-08-08 | Prestige Esport           | L   | 1.000      | -            | -                | -                | -         |   -28.00 | F1KU, forsyy, MaiL09, Plopski, stanislaw |
|           26 |      951 | 2026-08-08 | Team Liquid               | L   | 1.000      | -            | -                | -                | -         |    -2.57 | F1KU, forsyy, MaiL09, Plopski, stanislaw |
|           25 |      973 | 2026-08-07 | Prestige Esport           | W   | 0.997      | 0.818        | -                | 0.078 (0.063)    | 1 (0.997) |     2.98 | F1KU, forsyy, MaiL09, Plopski, stanislaw |
|           24 |     1099 | 2026-08-03 | Johnny Speeds             | L   | 0.970      | -            | -                | -                | -         |   -22.48 | F1KU, forsyy, MaiL09, Plopski, stanislaw |
|           23 |     1107 | 2026-08-03 | Fnatic                    | L   | 0.969      | -            | -                | -                | -         |    -6.39 | F1KU, forsyy, MaiL09, Plopski, stanislaw |
|           22 |     1114 | 2026-08-03 | Johnny Speeds             | W   | 0.969      | 0.450        | 0.012 (0.005)    | -                | 1 (0.969) |     7.18 | F1KU, forsyy, MaiL09, Plopski, stanislaw |
|           21 |     2172 | 2026-06-14 | Alliance                  | L   | 0.637      | -            | -                | -                | -         |    -2.96 | F1KU, forsyy, isak, Plopski, stanislaw   |
|           20 |     2184 | 2026-06-14 | Fnatic                    | W   | 0.636      | 0.374        | 0.045 (0.011)    | 0.898 (0.213)    | 1 (0.636) |    15.72 | F1KU, forsyy, isak, Plopski, stanislaw   |
|           19 |     2206 | 2026-06-13 | Nexus Gaming              | W   | 0.630      | -            | -                | -                | 1 (0.630) |     8.34 | F1KU, forsyy, isak, Plopski, stanislaw   |
|           18 |     2222 | 2026-06-13 | Esport Academy Copenhagen | W   | 0.629      | 0.374        | 0.024 (0.006)    | 0.778 (0.183)    | 1 (0.629) |    11.14 | F1KU, forsyy, isak, Plopski, stanislaw   |
|           17 |     2237 | 2026-06-13 | Atpūties                  | W   | 0.628      | -            | -                | -                | 1 (0.628) |     1.14 | F1KU, forsyy, isak, Plopski, stanislaw   |
|           16 |     2947 | 2026-05-21 | Betclic Apogee Esports    | L   | 0.478      | -            | -                | -                | -         |   -12.14 | F1KU, forsyy, isak, Plopski, stanislaw   |
|           15 |     2954 | 2026-05-21 | Rebels Gaming             | L   | 0.477      | -            | -                | -                | -         |   -11.77 | F1KU, forsyy, isak, Plopski, stanislaw   |
|           14 |     2956 | 2026-05-21 | Passion UA                | W   | 0.477      | -            | -                | -                | 1 (0.477) |     3.20 | F1KU, forsyy, isak, Plopski, stanislaw   |
|           13 |     2958 | 2026-05-21 | OG                        | L   | 0.477      | -            | -                | -                | -         |    -8.89 | F1KU, forsyy, isak, Plopski, stanislaw   |
|           12 |     4094 | 2026-04-16 | ARCRED                    | W   | 0.241      | -            | -                | -                | -         |     2.70 | F1KU, forsyy, isak, Plopski, stanislaw   |
|           11 |     4130 | 2026-04-14 | Phantom Esports           | W   | 0.229      | -            | -                | -                | -         |     1.23 | F1KU, forsyy, isak, Plopski, stanislaw   |
|           10 |     4148 | 2026-04-13 | Ex-RUBY                   | W   | 0.222      | -            | -                | -                | -         |     0.67 | F1KU, forsyy, isak, Plopski, stanislaw   |
|            9 |     4190 | 2026-04-11 | Basement Bobs             | W   | 0.209      | -            | -                | -                | -         |     0.29 | F1KU, forsyy, isak, Plopski, stanislaw   |
|            8 |     4451 | 2026-04-04 | Bebop                     | L   | 0.163      | -            | -                | -                | -         |    -4.39 | Dragon, forsyy, isak, Plopski, stanislaw |
|            7 |     4611 | 2026-04-02 | ARGOS                     | L   | 0.151      | -            | -                | -                | -         |    -3.21 | Dragon, forsyy, isak, Plopski, stanislaw |
|            6 |     4762 | 2026-04-01 | ENCE                      | W   | 0.141      | -            | -                | -                | -         |     1.46 | Dragon, forsyy, isak, Plopski, stanislaw |
|            5 |     5007 | 2026-03-29 | Ex-RUSTEC                 | L   | 0.121      | -            | -                | -                | -         |    -2.38 | Dragon, forsyy, isak, Plopski, stanislaw |
|            4 |     5104 | 2026-03-27 | EYEBALLERS                | L   | 0.111      | -            | -                | -                | -         |    -0.81 | Dragon, forsyy, isak, Plopski, stanislaw |
|            3 |     5327 | 2026-03-23 | UNiTY esports             | W   | 0.084      | -            | -                | -                | 1 (0.084) |     0.19 | Dragon, forsyy, isak, Plopski, stanislaw |
|            2 |     5341 | 2026-03-23 | GamerLegion               | L   | 0.083      | -            | -                | -                | -         |    -0.39 | Dragon, forsyy, isak, Plopski, stanislaw |
|            1 |     5355 | 2026-03-23 | UNiTY esports             | W   | 0.082      | -            | -                | -                | 1 (0.082) |     0.18 | Dragon, forsyy, isak, Plopski, stanislaw |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($10,486.36)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.02) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-08-20 |      1.000 | $4,000.00      | $4,000.00       |
| 2026-08-05 |      0.984 | $1,000.00      | $983.84         |
| 2026-06-14 |      0.637 | $4,008.99      | $2,554.80       |
| 2026-04-16 |      0.241 | $11,000.00     | $2,654.77       |
| 2026-03-28 |      0.117 | $2,500.00      | $292.94         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
