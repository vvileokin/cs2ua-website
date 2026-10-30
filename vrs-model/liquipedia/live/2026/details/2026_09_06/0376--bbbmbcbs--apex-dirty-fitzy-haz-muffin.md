### Roster Details<br />
Team Name: BBBMBCBS<br />
Roster: ApeX, Dirty, Fitzy, HaZ, muffin<br />
Global Rank: [376](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Asia]( ../../standings_asia_2026_09_06.md)<br />
Regional Rank: [44]( ../../standings_asia_2026_09_06.md)<br />
<br />
Final Rank Value:  465.8<br />
<br />
Final Rank Value (465.8) = Starting Rank Value (470.2) + Head To Head Adjustments (-4.4)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.000[<sup>1</sup>](#table2)
- Bounty Collected: 0.147[<sup>2</sup>](#table1)
- Opponent Network: 0.000[<sup>2</sup>](#table1)
- LAN Wins: 0.000[<sup>2</sup>](#table1)

The average of these factors is 0.037<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 470.2
- 400 + ( ( 0.037 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 470.2


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.006
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent     | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                          |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            5 |     4403 | 2026-04-05 | Skele        | L   | 0.168      | -            | -                | -                | -         |    -3.16 | ApeX, Dirty, Fitzy, HaZ, muffin |
|            4 |     4479 | 2026-04-04 | Ding Cuts    | W   | 0.162      | 0.278        | 0.000 (0.000)    | 0.053 (0.002)    | 0 (0.000) |     3.48 | ApeX, Dirty, Fitzy, HaZ, muffin |
|            3 |     4665 | 2026-04-02 | Time Waves   | L   | 0.148      | -            | -                | -                | -         |    -2.77 | ApeX, Dirty, Fitzy, HaZ, muffin |
|            2 |     5405 | 2026-03-22 | MARKnLARRY   | L   | 0.075      | -            | -                | -                | -         |    -0.73 | ApeX, Dirty, Fitzy, HaZ, muffin |
|            1 |     5526 | 2026-03-20 | Muttley Crew | L   | 0.062      | -            | -                | -                | -         |    -1.16 | ApeX, Dirty, Fitzy, HaZ, muffin |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($0.00)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
