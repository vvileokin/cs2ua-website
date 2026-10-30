### Roster Details<br />
Team Name: Drama Esports<br />
Roster: andr1x, choiv7, d0jca, miwo, nopzy<br />
Global Rank: [357](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [228]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  495.4<br />
<br />
Final Rank Value (495.4) = Starting Rank Value (494.5) + Head To Head Adjustments (0.9)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.000[<sup>1</sup>](#table2)
- Bounty Collected: 0.166[<sup>2</sup>](#table1)
- Opponent Network: 0.002[<sup>2</sup>](#table1)
- LAN Wins: 0.031[<sup>2</sup>](#table1)

The average of these factors is 0.050<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 494.5
- 400 + ( ( 0.050 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 494.5


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.011
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                      | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                             |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            8 |     4405 | 2026-04-05 | Magic                         | L   | 0.168      | -            | -                | -                | -         |    -0.04 | andr1x, choiv7, d0jca, miwo, nopzy |
|            7 |     4557 | 2026-04-03 | FaZe Clan                     | L   | 0.155      | -            | -                | -                | -         |    -0.01 | andr1x, choiv7, d0jca, miwo, nopzy |
|            6 |     4574 | 2026-04-03 | Békéscsabai E-Sport Egyesület | W   | 0.154      | 0.396        | 0.000 (0.000)    | 0.000 (0.000)    | 1 (0.154) |     1.81 | andr1x, choiv7, d0jca, miwo, nopzy |
|            5 |     4945 | 2026-03-29 | INFINITE                      | L   | 0.124      | -            | -                | -                | -         |    -0.07 | andr1x, choiv7, d0jca, miwo, nopzy |
|            4 |     4970 | 2026-03-29 | HYPERSPIRIT                   | W   | 0.123      | 0.354        | 0.002 (0.000)    | 0.426 (0.019)    | 1 (0.123) |     3.19 | andr1x, choiv7, d0jca, miwo, nopzy |
|            3 |     4990 | 2026-03-29 | Eternal Fire                  | L   | 0.122      | -            | -                | -                | -         |    -1.17 | andr1x, choiv7, d0jca, miwo, nopzy |
|            2 |     5110 | 2026-03-27 | DALUYONG                      | L   | 0.111      | -            | -                | -                | -         |    -2.19 | andr1x, choiv7, d0jca, miwo, nopzy |
|            1 |     5144 | 2026-03-26 | HYPERSPIRIT                   | L   | 0.105      | -            | -                | -                | -         |    -0.59 | andr1x, choiv7, d0jca, miwo, nopzy |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($0.00)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
