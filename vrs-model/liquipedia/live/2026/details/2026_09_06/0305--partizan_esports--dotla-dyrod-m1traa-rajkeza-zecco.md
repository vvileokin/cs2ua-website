### Roster Details<br />
Team Name: Partizan Esports<br />
Roster: DotlA, dyrod, m1traa, rajkeza, zecco<br />
Global Rank: [305](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [198]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  586.2<br />
<br />
Final Rank Value (586.2) = Starting Rank Value (576.3) + Head To Head Adjustments (9.9)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.000[<sup>1</sup>](#table2)
- Bounty Collected: 0.243[<sup>2</sup>](#table1)
- Opponent Network: 0.002[<sup>2</sup>](#table1)
- LAN Wins: 0.125[<sup>2</sup>](#table1)

The average of these factors is 0.093<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 576.3
- 400 + ( ( 0.093 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 576.3


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.044
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent        | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                               |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            6 |      941 | 2026-08-08 | Sashi Esport    | L   | 1.000      | -            | -                | -                | -         |    -0.85 | DotlA, dyrod, m1traa, rajkeza, zecco |
|            5 |      952 | 2026-08-08 | Orion Wanderers | W   | 1.000      | 0.818        | 0.000 (0.000)    | 0.000 (0.000)    | 1 (1.000) |     8.17 | DotlA, dyrod, m1traa, rajkeza, zecco |
|            4 |      976 | 2026-08-07 | FOKUS           | L   | 0.997      | -            | -                | -                | -         |    -0.99 | DotlA, dyrod, m1traa, rajkeza, zecco |
|            3 |     4941 | 2026-03-29 | IC Esports      | L   | 0.124      | -            | -                | -                | -         |    -0.02 | DotlA, dyrod, m1traa, rajkeza, zecco |
|            2 |     4986 | 2026-03-29 | BASEMENT BOYS   | L   | 0.123      | -            | -                | -                | -         |    -0.25 | DotlA, dyrod, m1traa, rajkeza, zecco |
|            1 |     5003 | 2026-03-29 | IC Esports      | W   | 0.122      | 0.354        | 0.178 (0.008)    | 0.558 (0.024)    | 1 (0.122) |     3.81 | DotlA, dyrod, m1traa, rajkeza, zecco |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($0.00)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
