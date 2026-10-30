### Roster Details<br />
Team Name: X-CITY<br />
Roster: ATLAS, Gagloy, mda, qu1ckk, tuzon<br />
Global Rank: [329](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [209]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  538.1<br />
<br />
Final Rank Value (538.1) = Starting Rank Value (523.1) + Head To Head Adjustments (15.0)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.000[<sup>1</sup>](#table2)
- Bounty Collected: 0.248[<sup>2</sup>](#table1)
- Opponent Network: 0.011[<sup>2</sup>](#table1)
- LAN Wins: 0.000[<sup>2</sup>](#table1)

The average of these factors is 0.065<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 523.1
- 400 + ( ( 0.065 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 523.1


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.039
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent     | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                            |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            6 |      324 | 2026-08-29 | UPGRADE Team | L   | 1.000      | -            | -                | -                | -         |    -1.93 | ATLAS, Gagloy, mda, qu1ckk, tuzon |
|            5 |      407 | 2026-08-27 | Color        | L   | 1.000      | -            | -                | -                | -         |    -1.45 | ATLAS, Gagloy, mda, qu1ckk, tuzon |
|            4 |      538 | 2026-08-24 | Team Nemesis | L   | 1.000      | -            | -                | -                | -         |    -0.68 | ATLAS, Gagloy, mda, qu1ckk, tuzon |
|            3 |      573 | 2026-08-23 | Walczaki     | W   | 1.000      | 0.143        | 0.064 (0.009)    | 0.799 (0.114)    | 0 (0.000) |    29.85 | ATLAS, Gagloy, mda, qu1ckk, tuzon |
|            2 |     2926 | 2026-05-22 | WeClear      | L   | 0.482      | -            | -                | -                | -         |    -9.56 | ATLAS, Gagloy, mda, qu1ckk, tuzon |
|            1 |     2935 | 2026-05-22 | BAKS Esports | L   | 0.481      | -            | -                | -                | -         |    -1.24 | ATLAS, Gagloy, mda, qu1ckk, tuzon |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($0.00)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
