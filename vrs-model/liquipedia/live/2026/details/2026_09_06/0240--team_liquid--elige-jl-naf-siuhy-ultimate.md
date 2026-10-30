### Roster Details<br />
Team Name: Team Liquid<br />
Roster: EliGE, jL, NAF, siuhy, ultimate<br />
Global Rank: [240](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [163]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  655.8<br />
<br />
Final Rank Value (655.8) = Starting Rank Value (655.3) + Head To Head Adjustments (0.4)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.332[<sup>1</sup>](#table2)
- Bounty Collected: 0.198[<sup>2</sup>](#table1)
- Opponent Network: 0.001[<sup>2</sup>](#table1)
- LAN Wins: 0.006[<sup>2</sup>](#table1)

The average of these factors is 0.134<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 655.3
- 400 + ( ( 0.134 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 655.3


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.002
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent             | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                               |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            8 |     3024 | 2026-05-19 | PARIVISION           | L   | 0.467      | -            | -                | -                | -         |    -0.16 | EliGE, flashie, NAF, siuhy, ultimate |
|            7 |     5717 | 2026-03-15 | Alliance             | L   | 0.031      | -            | -                | -                | -         |    -0.01 | EliGE, jL, NAF, siuhy, ultimate      |
|            6 |     5742 | 2026-03-15 | OG                   | L   | 0.029      | -            | -                | -                | -         |    -0.11 | EliGE, jL, NAF, siuhy, ultimate      |
|            5 |     5782 | 2026-03-14 | EYEBALLERS           | W   | 0.022      | 0.349        | 0.108 (0.001)    | 0.333 (0.003)    | 1 (0.022) |     0.68 | EliGE, jL, NAF, siuhy, ultimate      |
|            4 |     5819 | 2026-03-13 | Gaimin Gladiators    | L   | 0.017      | -            | -                | -                | -         |    -0.21 | EliGE, jL, NAF, siuhy, ultimate      |
|            3 |     5825 | 2026-03-13 | FC Famalicão Esports | L   | 0.016      | -            | -                | -                | -         |    -0.36 | EliGE, jL, NAF, siuhy, ultimate      |
|            2 |     5834 | 2026-03-13 | BESTIA               | W   | 0.016      | 0.349        | 0.014 (0.000)    | 0.482 (0.003)    | 1 (0.016) |     0.40 | EliGE, jL, NAF, siuhy, ultimate      |
|            1 |     5837 | 2026-03-13 | Hypewrld             | W   | 0.015      | 0.349        | 0.000 (0.000)    | 0.040 (0.000)    | 1 (0.015) |     0.21 | EliGE, jL, NAF, siuhy, ultimate      |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($4,977.82)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.01) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-05-23 |      0.494 | $10,000.00     | $4,941.90       |
| 2026-03-15 |      0.031 | $1,147.00      | $35.92          |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
