### Roster Details<br />
Team Name: Clutchain<br />
Roster: Kyojin, Nivera, Python, ScreaM, SHOGU<br />
Global Rank: [351](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [224]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  508.1<br />
<br />
Final Rank Value (508.1) = Starting Rank Value (497.1) + Head To Head Adjustments (11.1)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.000[<sup>1</sup>](#table2)
- Bounty Collected: 0.196[<sup>2</sup>](#table1)
- Opponent Network: 0.008[<sup>2</sup>](#table1)
- LAN Wins: 0.000[<sup>2</sup>](#table1)

The average of these factors is 0.051<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 497.1
- 400 + ( ( 0.051 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 497.1


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.043
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent         | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            7 |     2335 | 2026-06-08 | XI Esport        | L   | 0.597      | -            | -                | -                | -         |    -6.79 | Kyojin, Nivera, Python, ScreaM, SHOGU |
|            6 |     2415 | 2026-06-05 | VP.Prodigy       | W   | 0.577      | 0.143        | 0.000 (0.000)    | 0.011 (0.001)    | 0 (0.000) |     8.40 | Kyojin, Nivera, Python, ScreaM, SHOGU |
|            5 |     3718 | 2026-04-27 | Walczaki         | L   | 0.318      | -            | -                | -                | -         |    -0.55 | Kyojin, Nivera, Python, ScreaM, SHOGU |
|            4 |     3917 | 2026-04-24 | Permitta Esports | W   | 0.297      | 0.362        | 0.007 (0.001)    | 0.692 (0.074)    | 0 (0.000) |     7.98 | Kyojin, Nivera, Python, ScreaM, SHOGU |
|            3 |     4033 | 2026-04-19 | UNiTY esports    | L   | 0.264      | -            | -                | -                | -         |    -2.69 | Kyojin, Nivera, Python, ScreaM, SHOGU |
|            2 |     4106 | 2026-04-15 | SINNERS Esports  | L   | 0.237      | -            | -                | -                | -         |    -0.24 | Kyojin, Nivera, Python, ScreaM, SHOGU |
|            1 |     4141 | 2026-04-13 | MOUZ NXT         | W   | 0.224      | 0.362        | 0.000 (0.000)    | 0.104 (0.008)    | 0 (0.000) |     4.97 | Kyojin, Nivera, Python, ScreaM, SHOGU |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($0.00)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
