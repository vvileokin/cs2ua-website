### Roster Details<br />
Team Name: Aimclub (Romanian team)<br />
Roster: ERSIN, waZz, zewts<br />
Global Rank: [185](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [131]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  730.5<br />
<br />
Final Rank Value (730.5) = Starting Rank Value (704.5) + Head To Head Adjustments (25.9)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.274[<sup>1</sup>](#table2)
- Bounty Collected: 0.211[<sup>2</sup>](#table1)
- Opponent Network: 0.015[<sup>2</sup>](#table1)
- LAN Wins: 0.141[<sup>2</sup>](#table1)

The average of these factors is 0.160<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 704.5
- 400 + ( ( 0.160 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 704.5


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.123
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent            | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            8 |       77 | 2026-09-04 | FOKUS               | L   | 1.000      | -            | -                | -                | -         |    -2.33 | ERSIN, mhN1, ragga, waZz, zewts       |
|            7 |     1119 | 2026-08-02 | Team Spirit Academy | L   | 0.964      | -            | -                | -                | -         |   -10.20 | ADRON, ERSIN, ragga, waZz, zewts      |
|            6 |     1166 | 2026-08-01 | Young TigeRES       | W   | 0.957      | 0.278        | 0.001 (0.000)    | 0.037 (0.010)    | 0 (0.000) |     6.89 | ADRON, ERSIN, ragga, waZz, zewts      |
|            5 |     1231 | 2026-07-30 | Team Spirit Academy | W   | 0.944      | 0.278        | 0.005 (0.001)    | 0.283 (0.074)    | 0 (0.000) |    19.77 | ADRON, ERSIN, ragga, waZz, zewts      |
|            4 |     2201 | 2026-06-13 | Noir Verse          | L   | 0.631      | -            | -                | -                | -         |    -5.38 | ERSIN, RoberttMP, waZz, XELLOW, zewts |
|            3 |     2212 | 2026-06-13 | Azuolas             | W   | 0.630      | 0.374        | 0.001 (0.000)    | 0.250 (0.059)    | 1 (0.630) |    14.37 | ERSIN, RoberttMP, waZz, XELLOW, zewts |
|            2 |     2224 | 2026-06-13 | Fnatic              | L   | 0.629      | -            | -                | -                | -         |    -0.69 | ERSIN, RoberttMP, waZz, XELLOW, zewts |
|            1 |     2234 | 2026-06-13 | 6666                | W   | 0.628      | 0.374        | 0.000 (0.000)    | 0.024 (0.006)    | 1 (0.628) |     3.52 | ERSIN, RoberttMP, waZz, XELLOW, zewts |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($1,126.62)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-08-02 |      0.964 | $750.00        | $723.23         |
| 2026-06-14 |      0.637 | $633.00        | $403.39         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
