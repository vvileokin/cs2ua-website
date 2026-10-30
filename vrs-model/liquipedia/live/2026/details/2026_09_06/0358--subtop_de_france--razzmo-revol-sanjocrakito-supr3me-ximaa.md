### Roster Details<br />
Team Name: Subtop De France<br />
Roster: Razzmo, Revol, sanjoCRAKITO, Supr3me, XiMaa<br />
Global Rank: [358](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [229]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  495.3<br />
<br />
Final Rank Value (495.3) = Starting Rank Value (493.7) + Head To Head Adjustments (1.6)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.000[<sup>1</sup>](#table2)
- Bounty Collected: 0.188[<sup>2</sup>](#table1)
- Opponent Network: 0.009[<sup>2</sup>](#table1)
- LAN Wins: 0.000[<sup>2</sup>](#table1)

The average of these factors is 0.049<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 493.7
- 400 + ( ( 0.049 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 493.7


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.085
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                 | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                        |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           14 |      830 | 2026-08-13 | Vexar                    | L   | 1.000      | -            | -                | -                | -         |    -6.51 | Myzunic, Razzmo, sanjoCRAKITO, Supr3me, XiMaa |
|           13 |     1455 | 2026-07-24 | Benched gods             | L   | 0.901      | -            | -                | -                | -         |    -5.28 | Razzmo, Revol, sanjo, Supr3me, XiMaa          |
|           12 |     1483 | 2026-07-23 | Entropy Gaming           | L   | 0.895      | -            | -                | -                | -         |    -4.75 | Razzmo, Revol, sanjo, Supr3me, XiMaa          |
|           11 |     1651 | 2026-07-16 | Honvéd Esport            | L   | 0.851      | -            | -                | -                | -         |    -3.49 | AZIDOT, Razzmo, Revol, sanjoCRAKITO, Supr3me  |
|           10 |     1672 | 2026-07-15 | IC Academy               | L   | 0.844      | -            | -                | -                | -         |    -2.91 | AZIDOT, Razzmo, Revol, sanjoCRAKITO, Supr3me  |
|            9 |     1869 | 2026-07-03 | DONSTU Esports           | L   | 0.762      | -            | -                | -                | -         |    -4.45 | Razzmo, Revol, sanjoCRAKITO, Supr3me, XiMaa   |
|            8 |     1874 | 2026-07-03 | Honvéd Esport            | L   | 0.761      | -            | -                | -                | -         |    -3.77 | Razzmo, Revol, sanjoCRAKITO, Supr3me, XiMaa   |
|            7 |     1885 | 2026-07-02 | Atreides                 | L   | 0.756      | -            | -                | -                | -         |    -3.61 | Razzmo, Revol, sanjoCRAKITO, Supr3me, XiMaa   |
|            6 |     1925 | 2026-06-30 | Julie&cie                | W   | 0.743      | 0.303        | 0.001 (0.000)    | 0.098 (0.022)    | 0 (0.000) |    15.03 | Razzmo, Revol, sanjoCRAKITO, Supr3me, XiMaa   |
|            5 |     1967 | 2026-06-28 | Lilmix                   | W   | 0.730      | 0.303        | 0.001 (0.000)    | 0.266 (0.059)    | 0 (0.000) |    16.18 | Razzmo, Revol, sanjoCRAKITO, Supr3me, XiMaa   |
|            4 |     1979 | 2026-06-28 | ILLYRIANS (Kosovar team) | L   | 0.729      | -            | -                | -                | -         |    -4.47 | Razzmo, Revol, sanjoCRAKITO, Supr3me, XiMaa   |
|            3 |     2023 | 2026-06-25 | Hypewrld                 | W   | 0.710      | 0.333        | 0.000 (0.000)    | 0.040 (0.010)    | 0 (0.000) |    14.61 | Razzmo, Revol, sanjoCRAKITO, Supr3me, XiMaa   |
|            2 |     2787 | 2026-05-25 | SAW Youngsters           | L   | 0.502      | -            | -                | -                | -         |    -3.51 | AZIDOT, Razzmo, Revol, sanjo, XiMaa           |
|            1 |     2988 | 2026-05-21 | Ex-Zero Tenacity         | L   | 0.475      | -            | -                | -                | -         |    -1.46 | devoduvek, Razzmo, Revol, Supr3me, XiMaa      |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($0.00)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
