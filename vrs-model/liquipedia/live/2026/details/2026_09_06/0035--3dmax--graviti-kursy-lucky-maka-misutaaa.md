### Roster Details<br />
Team Name: 3DMAX<br />
Roster: Graviti, Kursy, Lucky, Maka, misutaaa<br />
Global Rank: [35](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [27]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  1300.0<br />
<br />
Final Rank Value (1300.0) = Starting Rank Value (1303.8) + Head To Head Adjustments (-3.7)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.657[<sup>1</sup>](#table2)
- Bounty Collected: 0.555[<sup>2</sup>](#table1)
- Opponent Network: 0.277[<sup>2</sup>](#table1)
- LAN Wins: 0.413[<sup>2</sup>](#table1)

The average of these factors is 0.475<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 1303.8
- 400 + ( ( 0.475 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 1303.8


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.391
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                  | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                   |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           49 |       88 | 2026-09-03 | HOTU                      | W   | 1.000      | 0.435        | 0.144 (0.063)    | 1.000 (0.435)    | -         |    20.50 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           48 |      114 | 2026-09-03 | INFINITE                  | W   | 1.000      | 0.435        | -                | 0.654 (0.284)    | -         |    12.87 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           47 |      123 | 2026-09-02 | Walczaki                  | W   | 1.000      | 0.435        | -                | 0.799 (0.347)    | -         |     5.30 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           46 |      126 | 2026-09-02 | MIBR                      | L   | 1.000      | -            | -                | -                | -         |    -9.52 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           45 |      147 | 2026-09-02 | HEROIC                    | L   | 1.000      | -            | -                | -                | -         |   -12.25 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           44 |      211 | 2026-08-31 | Butterfly (Russian team)  | W   | 1.000      | 0.435        | -                | 0.844 (0.367)    | -         |     7.93 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           43 |      768 | 2026-08-15 | Magic                     | L   | 1.000      | -            | -                | -                | -         |   -11.12 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           42 |      854 | 2026-08-12 | Natus Vincere             | L   | 1.000      | -            | -                | -                | -         |    -4.40 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           41 |     1240 | 2026-07-30 | MOUZ                      | L   | 0.943      | -            | -                | -                | -         |    -1.05 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           40 |     1375 | 2026-07-26 | FUT Esports               | W   | 0.916      | 0.903        | 1.000 (0.827)    | 0.354 (0.293)    | -         |    27.74 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           39 |     1453 | 2026-07-24 | Magic                     | W   | 0.902      | 0.903        | 0.201 (0.163)    | 0.398 (0.324)    | -         |    19.29 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           38 |     1479 | 2026-07-23 | Walczaki                  | L   | 0.895      | -            | -                | -                | -         |   -18.76 | Ex3rcice, Graviti, Kursy, Maka, misutaaa |
|           37 |     1522 | 2026-07-21 | Iberian Soul              | L   | 0.883      | -            | -                | -                | -         |   -17.72 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           36 |     1615 | 2026-07-17 | K27                       | L   | 0.857      | -            | -                | -                | -         |   -10.86 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           35 |     1634 | 2026-07-17 | Iberian Soul              | W   | 0.855      | 0.500        | 0.094 (0.040)    | 0.386 (0.165)    | 1 (0.855) |     9.23 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           34 |     1660 | 2026-07-16 | PaiN Gaming               | W   | 0.849      | 0.500        | 0.300 (0.127)    | 0.322 (0.137)    | 1 (0.849) |    13.90 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           33 |     1678 | 2026-07-15 | HEROIC                    | L   | 0.842      | -            | -                | -                | -         |   -11.07 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           32 |     1851 | 2026-07-04 | FaZe Clan                 | L   | 0.769      | -            | -                | -                | -         |    -4.53 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           31 |     1872 | 2026-07-03 | 9z Team                   | L   | 0.762      | -            | -                | -                | -         |    -2.82 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           30 |     1897 | 2026-07-02 | EYEBALLERS                | L   | 0.755      | -            | -                | -                | -         |   -10.96 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           29 |     1916 | 2026-07-01 | Ninjas in Pyjamas         | W   | 0.748      | 1.000        | 0.196 (0.146)    | 0.425 (0.318)    | 1 (0.748) |    13.67 | Graviti, Kursy, Lucky, Maka, misutaaa    |
|           28 |     2678 | 2026-05-28 | Alliance                  | L   | 0.522      | -            | -                | -                | -         |    -5.77 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|           27 |     2719 | 2026-05-27 | Magic                     | L   | 0.515      | -            | -                | -                | -         |    -6.32 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|           26 |     2994 | 2026-05-20 | Team Liquid               | L   | 0.473      | -            | -                | -                | -         |    -4.25 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|           25 |     3025 | 2026-05-19 | MIBR                      | L   | 0.467      | -            | -                | -                | -         |    -5.22 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|           24 |     4108 | 2026-04-15 | G2 Esports                | L   | 0.236      | -            | -                | -                | -         |    -0.61 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|           23 |     4124 | 2026-04-14 | Team Liquid               | W   | 0.230      | 1.000        | 0.206 (0.047)    | -                | 1 (0.230) |     5.30 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|           22 |     4142 | 2026-04-13 | Team Falcons              | L   | 0.224      | -            | -                | -                | -         |    -0.24 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|           21 |     4189 | 2026-04-11 | The MongolZ               | L   | 0.209      | -            | -                | -                | -         |    -2.21 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|           20 |     4220 | 2026-04-10 | Astralis                  | L   | 0.203      | -            | -                | -                | -         |    -2.04 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|           19 |     4255 | 2026-04-09 | MIBR                      | W   | 0.194      | 1.000        | 0.209 (0.041)    | -                | 1 (0.194) |     3.99 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|           18 |     4303 | 2026-04-07 | PARIVISION                | W   | 0.182      | 1.000        | 0.395 (0.072)    | -                | 1 (0.182) |     4.22 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|           17 |     4345 | 2026-04-06 | B8                        | W   | 0.175      | 1.000        | 0.263 (0.046)    | 0.572 (0.100)    | 1 (0.175) |     4.09 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|           16 |     4411 | 2026-04-05 | Team Voca                 | W   | 0.168      | -            | -                | -                | 1 (0.168) |     0.39 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|           15 |     4486 | 2026-04-04 | FOKUS                     | L   | 0.161      | -            | -                | -                | -         |    -3.11 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|           14 |     4635 | 2026-04-02 | B8                        | L   | 0.150      | -            | -                | -                | -         |    -1.23 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|           13 |     4654 | 2026-04-02 | BESTIA                    | L   | 0.149      | -            | -                | -                | -         |    -4.10 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|           12 |     4721 | 2026-04-01 | B8                        | W   | 0.143      | -            | -                | -                | 1 (0.143) |     3.34 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|           11 |     4755 | 2026-04-01 | WAZABI                    | W   | 0.141      | -            | -                | -                | 1 (0.141) |     0.16 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|           10 |     4790 | 2026-03-31 | Esport Academy Copenhagen | W   | 0.137      | -            | -                | -                | -         |     1.46 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|            9 |     4814 | 2026-03-31 | BESTIA                    | L   | 0.136      | -            | -                | -                | -         |    -3.78 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|            8 |     4826 | 2026-03-31 | Aimhaus                   | W   | 0.136      | -            | -                | -                | -         |     0.03 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|            7 |     4839 | 2026-03-31 | Falcons Force             | W   | 0.136      | -            | -                | -                | -         |     0.16 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|            6 |     4855 | 2026-03-31 | Sashi Academy             | W   | 0.135      | -            | -                | -                | -         |     0.03 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|            5 |     5248 | 2026-03-24 | Phantom Esports           | L   | 0.091      | -            | -                | -                | -         |    -2.71 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|            4 |     5268 | 2026-03-24 | Esport Academy Copenhagen | W   | 0.089      | -            | -                | -                | -         |     0.93 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|            3 |     5358 | 2026-03-23 | FOKUS                     | L   | 0.082      | -            | -                | -                | -         |    -1.62 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|            2 |     5363 | 2026-03-23 | GAMEHARMONY               | W   | 0.082      | -            | -                | -                | -         |     0.02 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |
|            1 |     5369 | 2026-03-23 | FOKUS REALITY             | W   | 0.081      | -            | -                | -                | -         |     0.02 | Ex3rcice, Graviti, Lucky, Maka, misutaaa |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($153,394.33)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.30) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-09-03 |      1.000 | $22,000.00     | $22,000.00      |
| 2026-08-23 |      1.000 | $10,000.00     | $10,000.00      |
| 2026-08-02 |      0.962 | $61,250.00     | $58,924.77      |
| 2026-07-18 |      0.864 | $11,000.00     | $9,499.72       |
| 2026-07-12 |      0.821 | $27,500.00     | $22,586.92      |
| 2026-05-30 |      0.537 | $7,500.00      | $4,026.74       |
| 2026-05-23 |      0.494 | $5,000.00      | $2,470.95       |
| 2026-04-19 |      0.264 | $20,000.00     | $5,276.85       |
| 2026-04-11 |      0.210 | $87,500.00     | $18,346.64      |
| 2026-04-02 |      0.151 | $1,739.00      | $261.74         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
