### Roster Details<br />
Team Name: GamerLegion<br />
Roster: FL4MUS, hypex, REZ, Snax, Tauson<br />
Global Rank: [28](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [21]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  1347.1<br />
<br />
Final Rank Value (1347.1) = Starting Rank Value (1386.7) + Head To Head Adjustments (-39.5)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.683[<sup>1</sup>](#table2)
- Bounty Collected: 0.551[<sup>2</sup>](#table1)
- Opponent Network: 0.190[<sup>2</sup>](#table1)
- LAN Wins: 0.652[<sup>2</sup>](#table1)

The average of these factors is 0.519<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 1386.7
- 400 + ( ( 0.519 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 1386.7


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


| Match Played | Match ID | Date       | Opponent          | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                           |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           32 |      130 | 2026-09-02 | K27               | L   | 1.000      | -            | -                | -                | -         |   -18.84 | FL4MUS, hypex, maden, REZ, Snax  |
|           31 |      145 | 2026-09-02 | Nuclear TigeRES   | L   | 1.000      | -            | -                | -                | -         |   -22.47 | FL4MUS, hypex, maden, REZ, Snax  |
|           30 |      651 | 2026-08-19 | MOUZ              | L   | 1.000      | -            | -                | -                | -         |    -1.80 | FL4MUS, hypex, REZ, Snax, Tauson |
|           29 |      842 | 2026-08-13 | JiJieHao          | W   | 1.000      | 1.000        | 0.070 (0.070)    | 0.426 (0.426)    | 1 (1.000) |    15.97 | FL4MUS, hypex, REZ, Snax, Tauson |
|           28 |      870 | 2026-08-12 | Luminosity Gaming | W   | 1.000      | 1.000        | 0.146 (0.146)    | 0.185 (0.185)    | 1 (1.000) |    10.18 | FL4MUS, hypex, REZ, Snax, Tauson |
|           27 |     1495 | 2026-07-22 | HOTU              | L   | 0.890      | -            | -                | -                | -         |   -11.62 | FL4MUS, hypex, REZ, Snax, Tauson |
|           26 |     2044 | 2026-06-24 | 9INE              | L   | 0.704      | -            | -                | -                | -         |   -19.50 | hypex, PR, REZ, Snax, Tauson     |
|           25 |     2057 | 2026-06-23 | Acend             | L   | 0.698      | -            | -                | -                | -         |   -15.56 | hypex, PR, REZ, Snax, Tauson     |
|           24 |     2360 | 2026-06-07 | B8                | L   | 0.590      | -            | -                | -                | -         |    -7.56 | hypex, PR, REZ, Snax, Tauson     |
|           23 |     2383 | 2026-06-06 | BetBoom Team      | L   | 0.584      | -            | -                | -                | -         |    -7.42 | hypex, PR, REZ, Snax, Tauson     |
|           22 |     2406 | 2026-06-06 | Astralis          | L   | 0.582      | -            | -                | -                | -         |    -8.79 | hypex, PR, REZ, Snax, Tauson     |
|           21 |     2444 | 2026-06-04 | BIG               | W   | 0.570      | 0.624        | 0.151 (0.054)    | 0.572 (0.204)    | 1 (0.570) |    11.80 | hypex, PR, REZ, Snax, Tauson     |
|           20 |     2466 | 2026-06-03 | BetBoom Team      | L   | 0.563      | -            | -                | -                | -         |    -7.42 | hypex, PR, REZ, Snax, Tauson     |
|           19 |     2485 | 2026-06-02 | FlyQuest          | W   | 0.557      | -            | -                | -                | 1 (0.557) |     2.77 | hypex, PR, REZ, Snax, Tauson     |
|           18 |     2497 | 2026-06-02 | NRG               | W   | 0.556      | 0.624        | -                | 0.359 (0.125)    | 1 (0.556) |     3.02 | hypex, PR, REZ, Snax, Tauson     |
|           17 |     3069 | 2026-05-17 | Natus Vincere     | L   | 0.451      | -            | -                | -                | -         |    -3.91 | hypex, PR, REZ, Snax, Tauson     |
|           16 |     3097 | 2026-05-16 | Legacy            | W   | 0.444      | 1.000        | 1.000 (0.444)    | 0.457 (0.203)    | 1 (0.444) |    12.70 | hypex, PR, REZ, Snax, Tauson     |
|           15 |     3127 | 2026-05-15 | PaiN Gaming       | W   | 0.437      | 1.000        | 0.300 (0.131)    | 0.322 (0.141)    | 1 (0.437) |     5.37 | hypex, PR, REZ, Snax, Tauson     |
|           14 |     3172 | 2026-05-13 | Astralis          | W   | 0.426      | 1.000        | 0.380 (0.162)    | 0.316 (0.135)    | 1 (0.426) |     7.56 | hypex, PR, REZ, Snax, Tauson     |
|           13 |     3178 | 2026-05-13 | Team Liquid       | W   | 0.424      | 1.000        | 0.206 (0.087)    | 0.390 (0.165)    | 1 (0.424) |     8.03 | hypex, PR, REZ, Snax, Tauson     |
|           12 |     3215 | 2026-05-12 | Natus Vincere     | L   | 0.418      | -            | -                | -                | -         |    -3.44 | hypex, PR, REZ, Snax, Tauson     |
|           11 |     3254 | 2026-05-11 | SINNERS Esports   | W   | 0.412      | 1.000        | 0.103 (0.042)    | 0.478 (0.197)    | 1 (0.412) |     2.09 | hypex, PR, REZ, Snax, Tauson     |
|           10 |     3484 | 2026-05-02 | Team Vitality     | L   | 0.351      | -            | -                | -                | -         |    -0.60 | hypex, PR, REZ, Snax, Tauson     |
|            9 |     3529 | 2026-05-01 | Astralis          | W   | 0.346      | 1.000        | 0.380 (0.131)    | -                | -         |     6.33 | hypex, PR, REZ, Snax, Tauson     |
|            8 |     3581 | 2026-04-30 | Natus Vincere     | L   | 0.339      | -            | -                | -                | -         |    -2.82 | hypex, PR, REZ, Snax, Tauson     |
|            7 |     3627 | 2026-04-29 | FURIA             | W   | 0.332      | 1.000        | 0.779 (0.259)    | 0.376 (0.125)    | -         |     9.46 | hypex, PR, REZ, Snax, Tauson     |
|            6 |     4461 | 2026-04-04 | BetBoom Team      | L   | 0.163      | -            | -                | -                | -         |    -1.98 | hypex, PR, REZ, Snax, Tauson     |
|            5 |     4538 | 2026-04-03 | G2 Esports        | L   | 0.156      | -            | -                | -                | -         |    -0.60 | hypex, PR, REZ, Snax, Tauson     |
|            4 |     4610 | 2026-04-02 | Ninjas in Pyjamas | W   | 0.151      | -            | -                | -                | -         |     0.10 | hypex, PR, REZ, Snax, Tauson     |
|            3 |     4719 | 2026-04-01 | 9INE              | W   | 0.143      | -            | -                | -                | -         |     0.63 | hypex, PR, REZ, Snax, Tauson     |
|            2 |     5134 | 2026-03-27 | Alliance          | L   | 0.109      | -            | -                | -                | -         |    -1.59 | hypex, PR, REZ, Snax, Tauson     |
|            1 |     5341 | 2026-03-23 | Metizport         | W   | 0.083      | -            | -                | -                | -         |     0.39 | hypex, PR, REZ, Snax, Tauson     |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($174,983.14)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.34) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-08-23 |      1.000 | $35,000.00     | $35,000.00      |
| 2026-07-26 |      0.917 | $7,500.00      | $6,877.95       |
| 2026-06-28 |      0.731 | $2,000.00      | $1,461.30       |
| 2026-06-09 |      0.604 | $10,000.00     | $6,038.43       |
| 2026-05-17 |      0.451 | $170,000.00    | $76,653.47      |
| 2026-05-03 |      0.357 | $130,000.00    | $46,450.93      |
| 2026-04-04 |      0.164 | $13,500.00     | $2,208.13       |
| 2026-03-28 |      0.117 | $2,500.00      | $292.94         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
