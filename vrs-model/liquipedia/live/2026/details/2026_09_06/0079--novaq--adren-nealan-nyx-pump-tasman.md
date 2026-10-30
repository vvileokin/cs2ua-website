### Roster Details<br />
Team Name: NOVAQ<br />
Roster: AdreN, neaLaN, nyx, Pump, tasman<br />
Global Rank: [79](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [60]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  1019.9<br />
<br />
Final Rank Value (1019.9) = Starting Rank Value (989.3) + Head To Head Adjustments (30.6)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.389[<sup>1</sup>](#table2)
- Bounty Collected: 0.286[<sup>2</sup>](#table1)
- Opponent Network: 0.077[<sup>2</sup>](#table1)
- LAN Wins: 0.486[<sup>2</sup>](#table1)

The average of these factors is 0.310<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 989.3
- 400 + ( ( 0.310 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 989.3


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.142
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                 | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                              |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           15 |       98 | 2026-09-03 | Rune Eaters Esports      | L   | 1.000      | -            | -                | -                | -         |   -14.66 | AdreN, neaLaN, nyx, Pump, tasman    |
|           14 |     1372 | 2026-07-26 | Rune Eaters Esports      | W   | 0.916      | 0.396        | 0.024 (0.009)    | 0.772 (0.280)    | 1 (0.916) |    15.44 | AdreN, neaLaN, nyx, Pump, tasman    |
|           13 |     1401 | 2026-07-25 | DEPO                     | W   | 0.910      | 0.396        | 0.021 (0.008)    | 0.443 (0.160)    | 1 (0.910) |    19.14 | AdreN, neaLaN, nyx, Pump, tasman    |
|           12 |     1424 | 2026-07-24 | OMEGA                    | W   | 0.908      | 0.396        | 0.027 (0.010)    | 0.399 (0.143)    | 1 (0.908) |    21.89 | AdreN, neaLaN, nyx, Pump, tasman    |
|           11 |     1430 | 2026-07-24 | Team Orda                | W   | 0.907      | 0.396        | 0.002 (0.001)    | 0.035 (0.013)    | 1 (0.907) |     4.26 | AdreN, neaLaN, nyx, Pump, tasman    |
|           10 |     2024 | 2026-06-25 | Rune Eaters Esports      | L   | 0.709      | -            | -                | -                | -         |    -8.31 | AdreN, kAlash, neaLaN, Pump, tasman |
|            9 |     2030 | 2026-06-25 | The Huns Esports         | L   | 0.708      | -            | -                | -                | -         |   -14.86 | AdreN, kAlash, neaLaN, Pump, tasman |
|            8 |     2038 | 2026-06-24 | Rune Eaters Esports      | W   | 0.707      | 0.324        | 0.024 (0.006)    | 0.772 (0.177)    | 1 (0.707) |    13.89 | AdreN, kAlash, neaLaN, Pump, tasman |
|            7 |     4664 | 2026-04-02 | JUMBO TEAM               | L   | 0.148      | -            | -                | -                | -         |    -4.37 | def1zer, ICY, neaLaN, Pump, tasman  |
|            6 |     4676 | 2026-04-01 | K27                      | L   | 0.147      | -            | -                | -                | -         |    -0.33 | def1zer, ICY, neaLaN, Pump, tasman  |
|            5 |     5722 | 2026-03-15 | ILLYRIANS (Kosovar team) | L   | 0.031      | -            | -                | -                | -         |    -0.77 | def1zer, ICY, neaLaN, Pump, tasman  |
|            4 |     5746 | 2026-03-15 | OMEGA                    | L   | 0.028      | -            | -                | -                | -         |    -0.16 | def1zer, ICY, neaLaN, Pump, tasman  |
|            3 |     5762 | 2026-03-14 | Illwill                  | L   | 0.024      | -            | -                | -                | -         |    -0.69 | def1zer, ICY, neaLaN, Pump, tasman  |
|            2 |     5865 | 2026-03-12 | HAVU                     | W   | 0.011      | 0.384        | 0.004 (0.000)    | 0.375 (0.002)    | 0 (0.000) |     0.11 | def1zer, ICY, neaLaN, Pump, tasman  |
|            1 |     5924 | 2026-03-11 | Aimclub (Romanian team)  | W   | 0.002      | 0.384        | 0.000 (0.000)    | 0.062 (0.000)    | 0 (0.000) |     0.00 | def1zer, ICY, neaLaN, Pump, tasman  |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($13,772.29)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.03) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-07-26 |      0.916 | $15,000.00     | $13,742.01      |
| 2026-03-15 |      0.031 | $500.00        | $15.39          |
| 2026-03-15 |      0.029 | $511.00        | $14.88          |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
