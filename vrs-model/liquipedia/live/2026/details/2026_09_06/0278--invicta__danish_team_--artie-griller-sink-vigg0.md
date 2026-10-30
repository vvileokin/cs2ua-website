### Roster Details<br />
Team Name: Invicta (Danish team)<br />
Roster: artie, Griller, SinK, vigg0<br />
Global Rank: [278](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [182]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  618.2<br />
<br />
Final Rank Value (618.2) = Starting Rank Value (632.0) + Head To Head Adjustments (-13.8)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.249[<sup>1</sup>](#table2)
- Bounty Collected: 0.181[<sup>2</sup>](#table1)
- Opponent Network: 0.003[<sup>2</sup>](#table1)
- LAN Wins: 0.055[<sup>2</sup>](#table1)

The average of these factors is 0.122<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 632.0
- 400 + ( ( 0.122 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 632.0


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.019
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent             | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                               |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            6 |     2253 | 2026-06-12 | Ex-Sashi Academy     | L   | 0.624      | -            | -                | -                | -         |    -7.48 | artie, Griller, Meldola, SinK, vigg0 |
|            5 |     2260 | 2026-06-12 | Washed (Danish team) | L   | 0.624      | -            | -                | -                | -         |    -5.53 | artie, Griller, Meldola, SinK, vigg0 |
|            4 |     2849 | 2026-05-23 | Strael-Bora          | L   | 0.491      | -            | -                | -                | -         |    -4.13 | artie, Griller, SinK, Teelz, vigg0   |
|            3 |     2862 | 2026-05-23 | WOPA Esport          | L   | 0.490      | -            | -                | -                | -         |    -2.07 | artie, Griller, SinK, Teelz, vigg0   |
|            2 |     2889 | 2026-05-23 | Fortress Esport      | W   | 0.488      | 0.341        | 0.002 (0.000)    | 0.208 (0.035)    | 1 (0.488) |    10.20 | artie, Griller, SinK, Teelz, vigg0   |
|            1 |     3849 | 2026-04-25 | Sashi Academy        | L   | 0.304      | -            | -                | -                | -         |    -4.75 | artie, Griller, SinK, vigg0, Viggo   |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($497.42)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-06-13 |      0.630 | $789.00        | $497.42         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
