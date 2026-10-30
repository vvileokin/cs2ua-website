### Roster Details<br />
Team Name: WOPA Esport<br />
Roster: kwezz, Patti, Queenix, sL1m3, Zanto<br />
Global Rank: [103](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [78]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  921.6<br />
<br />
Final Rank Value (921.6) = Starting Rank Value (988.8) + Head To Head Adjustments (-67.2)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.346[<sup>1</sup>](#table2)
- Bounty Collected: 0.292[<sup>2</sup>](#table1)
- Opponent Network: 0.067[<sup>2</sup>](#table1)
- LAN Wins: 0.534[<sup>2</sup>](#table1)

The average of these factors is 0.310<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 988.8
- 400 + ( ( 0.310 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 988.8


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.294
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent              | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                 |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           47 |      314 | 2026-08-29 | Ex-Zero Tenacity      | L   | 1.000      | -            | -                | -                | -         |   -13.14 | kwezz, Patti, Queenix, sL1m3, Zanto    |
|           46 |      325 | 2026-08-29 | 9INE                  | L   | 1.000      | -            | -                | -                | -         |   -11.58 | kwezz, Patti, Queenix, sL1m3, Zanto    |
|           45 |      375 | 2026-08-28 | G2 Ares               | L   | 1.000      | -            | -                | -                | -         |   -17.44 | kwezz, Patti, Queenix, sL1m3, Zanto    |
|           44 |      400 | 2026-08-27 | ENCE                  | W   | 1.000      | 0.371        | 0.012 (0.005)    | 0.515 (0.191)    | -         |    12.29 | kwezz, Patti, Queenix, sL1m3, Zanto    |
|           43 |      428 | 2026-08-27 | GenOne                | L   | 1.000      | -            | -                | -                | -         |    -9.87 | kwezz, Patti, Queenix, sL1m3, Zanto    |
|           42 |     1199 | 2026-07-31 | CYBERSHOKE Esports    | L   | 0.951      | -            | -                | -                | -         |   -14.92 | kwezz, Patti, Queenix, sL1m3, Zanto    |
|           41 |     1283 | 2026-07-29 | Fortress Esport       | W   | 0.935      | 0.396        | 0.002 (0.001)    | 0.208 (0.077)    | -         |     5.87 | kwezz, Patti, Queenix, sL1m3, Zanto    |
|           40 |     1371 | 2026-07-26 | Lazer Cats            | L   | 0.916      | -            | -                | -                | -         |   -21.20 | kwezz, Patti, Queenix, sL1m3, Zanto    |
|           39 |     1422 | 2026-07-25 | Fortress Esport       | W   | 0.908      | 0.396        | 0.002 (0.001)    | 0.208 (0.075)    | -         |     4.98 | kwezz, Patti, Queenix, sL1m3, Zanto    |
|           38 |     2204 | 2026-06-13 | MASQ                  | W   | 0.630      | -            | -                | -                | 1 (0.630) |     3.38 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           37 |     2220 | 2026-06-13 | MASONIC               | L   | 0.629      | -            | -                | -                | -         |   -12.83 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           36 |     2254 | 2026-06-12 | Washed (Danish team)  | W   | 0.624      | 0.357        | 0.009 (0.002)    | -                | 1 (0.624) |     4.97 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           35 |     2259 | 2026-06-12 | Ex-Sashi Academy      | W   | 0.624      | 0.357        | -                | 0.188 (0.042)    | 1 (0.624) |     3.41 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           34 |     2808 | 2026-05-24 | 100 Thieves           | W   | 0.497      | 0.341        | 0.150 (0.025)    | 0.590 (0.100)    | 1 (0.497) |    14.27 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           33 |     2817 | 2026-05-24 | Fortress Esport       | W   | 0.496      | 0.341        | -                | 0.208 (0.035)    | 1 (0.496) |     3.68 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           32 |     2825 | 2026-05-24 | 100 Thieves           | L   | 0.496      | -            | -                | -                | -         |    -1.33 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           31 |     2862 | 2026-05-23 | Invicta (Danish team) | W   | 0.490      | -            | -                | -                | 1 (0.490) |     2.07 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           30 |     2888 | 2026-05-23 | 95 Vikings            | W   | 0.488      | -            | -                | -                | 1 (0.488) |     0.61 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           29 |     3573 | 2026-05-01 | Black Phoenix         | L   | 0.341      | -            | -                | -                | -         |    -6.45 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           28 |     3699 | 2026-04-28 | BRUTE                 | W   | 0.321      | -            | -                | -                | -         |     1.68 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           27 |     3745 | 2026-04-27 | Lilmix                | L   | 0.315      | -            | -                | -                | -         |    -7.96 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           26 |     3791 | 2026-04-26 | MASONIC               | W   | 0.310      | 0.322        | 0.006 (0.001)    | -                | 1 (0.310) |     3.75 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           25 |     3815 | 2026-04-26 | Sashi Academy         | W   | 0.308      | -            | -                | -                | 1 (0.308) |     1.27 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           24 |     3850 | 2026-04-25 | XI Esport             | W   | 0.304      | -            | -                | -                | 1 (0.304) |     1.14 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           23 |     4200 | 2026-04-11 | Ex-RUBY               | L   | 0.208      | -            | -                | -                | -         |    -5.60 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           22 |     4314 | 2026-04-07 | Walczaki              | L   | 0.181      | -            | -                | -                | -         |    -2.59 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           21 |     4337 | 2026-04-06 | ENCE                  | W   | 0.176      | 0.435        | 0.012 (0.001)    | 0.515 (0.039)    | -         |     2.53 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           20 |     4380 | 2026-04-05 | Ex-RUBY               | L   | 0.170      | -            | -                | -                | -         |    -4.60 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           19 |     4520 | 2026-04-03 | Ex-RUSTEC             | L   | 0.157      | -            | -                | -                | -         |    -2.46 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           18 |     4558 | 2026-04-03 | Ex-Zero Tenacity      | W   | 0.155      | 0.371        | 0.031 (0.002)    | 1.000 (0.058)    | -         |     1.96 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           17 |     4747 | 2026-04-01 | ARGOS                 | W   | 0.142      | 0.435        | 0.010 (0.001)    | 0.389 (0.024)    | -         |     2.00 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           16 |     4860 | 2026-03-31 | Team Nemesis          | L   | 0.135      | -            | -                | -                | -         |    -1.36 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           15 |     4885 | 2026-03-30 | Bebop                 | W   | 0.131      | -            | -                | -                | -         |     0.23 | anarkez, kwezz, Patti, thamlike, Zanto |
|           14 |     4901 | 2026-03-30 | Bebop                 | W   | 0.130      | -            | -                | -                | -         |     0.88 | anarkez, kwezz, Patti, thamlike, Zanto |
|           13 |     4927 | 2026-03-30 | Hypewrld              | W   | 0.128      | -            | -                | -                | -         |     0.43 | anarkez, kwezz, Patti, thamlike, Zanto |
|           12 |     4975 | 2026-03-29 | ARGOS                 | L   | 0.123      | -            | -                | -                | -         |    -2.17 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           11 |     5122 | 2026-03-27 | Black Phoenix         | L   | 0.110      | -            | -                | -                | -         |    -2.22 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|           10 |     5217 | 2026-03-25 | Permitta Esports      | W   | 0.096      | 0.435        | -                | 0.692 (0.029)    | -         |     0.91 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|            9 |     5336 | 2026-03-23 | Cirahvi               | W   | 0.083      | -            | -                | -                | -         |     0.31 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|            8 |     5442 | 2026-03-21 | Permitta Esports      | L   | 0.071      | -            | -                | -                | -         |    -1.57 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|            7 |     5496 | 2026-03-20 | Persona Grata         | W   | 0.064      | -            | -                | -                | -         |     0.12 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|            6 |     5554 | 2026-03-19 | Bushido Wildcats      | W   | 0.056      | 0.384        | 0.017 (0.000)    | -                | -         |     0.55 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|            5 |     5586 | 2026-03-18 | KHAN                  | W   | 0.051      | -            | -                | -                | -         |     0.06 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|            4 |     5649 | 2026-03-17 | G2 Ares               | L   | 0.043      | -            | -                | -                | -         |    -0.59 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|            3 |     5770 | 2026-03-14 | Bebop                 | L   | 0.023      | -            | -                | -                | -         |    -0.58 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|            2 |     5840 | 2026-03-13 | Rune Eaters Esports   | L   | 0.015      | -            | -                | -                | -         |    -0.11 | kwezz, Patti, sL1m3, thamlike, Zanto   |
|            1 |     5915 | 2026-03-11 | Acend                 | L   | 0.004      | -            | -                | -                | -         |    -0.01 | kwezz, Patti, sL1m3, thamlike, Zanto   |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($6,563.15)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.01) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-08-30 |      1.000 | $750.00        | $750.00         |
| 2026-06-13 |      0.630 | $1,563.00      | $985.38         |
| 2026-05-24 |      0.497 | $5,804.00      | $2,885.61       |
| 2026-04-26 |      0.310 | $6,274.41      | $1,942.16       |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
