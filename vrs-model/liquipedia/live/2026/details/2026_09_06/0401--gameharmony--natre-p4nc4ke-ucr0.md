### Roster Details<br />
Team Name: GAMEHARMONY<br />
Roster: Natre, P4nc4ke, ucr0<br />
Global Rank: [401](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [250]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  385.4<br />
<br />
Final Rank Value (385.4) = Starting Rank Value (404.4) + Head To Head Adjustments (-18.9)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.000[<sup>1</sup>](#table2)
- Bounty Collected: 0.000[<sup>2</sup>](#table1)
- Opponent Network: 0.000[<sup>2</sup>](#table1)
- LAN Wins: 0.009[<sup>2</sup>](#table1)

The average of these factors is 0.002<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 404.4
- 400 + ( ( 0.002 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 404.4


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.003
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent      | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                              |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            6 |     1972 | 2026-06-28 | Leo Team      | L   | 0.729      | -            | -                | -                | -         |    -1.11 | Natre, P4nc4ke, RSK, Styx, ucr0     |
|            5 |     1975 | 2026-06-28 | Aimhaus       | L   | 0.729      | -            | -                | -                | -         |   -10.06 | Natre, P4nc4ke, RSK, Styx, ucr0     |
|            4 |     1977 | 2026-06-28 | Coalesce      | L   | 0.729      | -            | -                | -                | -         |    -8.98 | Natre, P4nc4ke, RSK, Styx, ucr0     |
|            3 |     5357 | 2026-03-23 | FOKUS REALITY | W   | 0.082      | 0.333        | 0.000 (0.000)    | 0.000 (0.000)    | 1 (0.082) |     1.27 | kriips, Natre, P4nc4ke, pat_u, ucr0 |
|            2 |     5363 | 2026-03-23 | 3DMAX         | L   | 0.082      | -            | -                | -                | -         |    -0.02 | kriips, Natre, P4nc4ke, pat_u, ucr0 |
|            1 |     5368 | 2026-03-23 | FOKUS         | L   | 0.081      | -            | -                | -                | -         |    -0.03 | kriips, Natre, P4nc4ke, pat_u, ucr0 |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($0.00)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
