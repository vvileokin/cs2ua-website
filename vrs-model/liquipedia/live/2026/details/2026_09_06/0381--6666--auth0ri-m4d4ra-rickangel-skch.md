### Roster Details<br />
Team Name: 6666<br />
Roster: auth0ri, m4d4ra, rickangel, skcH<br />
Global Rank: [381](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [240]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  432.7<br />
<br />
Final Rank Value (432.7) = Starting Rank Value (433.4) + Head To Head Adjustments (-0.7)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.000[<sup>1</sup>](#table2)
- Bounty Collected: 0.000[<sup>2</sup>](#table1)
- Opponent Network: 0.000[<sup>2</sup>](#table1)
- LAN Wins: 0.070[<sup>2</sup>](#table1)

The average of these factors is 0.018<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 433.4
- 400 + ( ( 0.018 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 433.4


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.024
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                  |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            6 |     1958 | 2026-06-28 | Esport BERG             | L   | 0.731      | -            | -                | -                | -         |    -2.63 | auth0ri, dENZY, m4d4ra, rickangel, skcH |
|            5 |     1963 | 2026-06-28 | SINQU Esports           | L   | 0.731      | -            | -                | -                | -         |    -2.53 | auth0ri, dENZY, m4d4ra, rickangel, skcH |
|            4 |     1965 | 2026-06-28 | ASTRAL Esports          | L   | 0.730      | -            | -                | -                | -         |    -0.87 | auth0ri, dENZY, m4d4ra, rickangel, skcH |
|            3 |     2207 | 2026-06-13 | Alliance                | L   | 0.630      | -            | -                | -                | -         |    -0.10 | auth0ri, fix, m4d4ra, rickangel, skcH   |
|            2 |     2226 | 2026-06-13 | Minkens finest          | W   | 0.629      | 0.374        | 0.000 (0.000)    | 0.000 (0.000)    | 1 (0.629) |     8.92 | auth0ri, fix, m4d4ra, rickangel, skcH   |
|            1 |     2234 | 2026-06-13 | Aimclub (Romanian team) | L   | 0.628      | -            | -                | -                | -         |    -3.52 | auth0ri, fix, m4d4ra, rickangel, skcH   |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($0.00)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
