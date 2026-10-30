### Roster Details<br />
Team Name: Wanted Goons<br />
Roster: febreeze, hibui, Johan, killerPandas, Magic<br />
Global Rank: [247](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Americas]( ../../standings_americas_2026_09_06.md)<br />
Regional Rank: [55]( ../../standings_americas_2026_09_06.md)<br />
<br />
Final Rank Value:  652.2<br />
<br />
Final Rank Value (652.2) = Starting Rank Value (698.9) + Head To Head Adjustments (-46.7)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.212[<sup>1</sup>](#table2)
- Bounty Collected: 0.205[<sup>2</sup>](#table1)
- Opponent Network: 0.013[<sup>2</sup>](#table1)
- LAN Wins: 0.198[<sup>2</sup>](#table1)

The average of these factors is 0.157<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 698.9
- 400 + ( ( 0.157 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 698.9


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.084
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent               | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                        |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           26 |      247 | 2026-08-30 | For Fun                | L   | 1.000      | -            | -                | -                | -         |    -9.48 | febreeze, hibui, Johan, killerPandas, Magic   |
|           25 |      294 | 2026-08-29 | Without a Roof         | L   | 1.000      | -            | -                | -                | -         |   -10.66 | febreeze, hibui, Johan, killerPandas, Magic   |
|           24 |      299 | 2026-08-29 | NuTorious              | W   | 1.000      | 0.333        | 0.002 (0.001)    | 0.198 (0.066)    | 1 (1.000) |    17.63 | febreeze, hibui, Johan, killerPandas, Magic   |
|           23 |     1919 | 2026-06-30 | Overtake Sector        | L   | 0.746      | -            | -                | -                | -         |   -11.12 | febreeze, hibui, Johan, killerPandas, Magic   |
|           22 |     2194 | 2026-06-13 | Olympus                | L   | 0.633      | -            | -                | -                | -         |   -13.91 | febreeze, hibui, Johan, killerPandas, Magic   |
|           21 |     2199 | 2026-06-13 | DETONATE               | L   | 0.631      | -            | -                | -                | -         |    -9.72 | febreeze, hibui, Johan, killerPandas, Magic   |
|           20 |     2243 | 2026-06-12 | NuTorious              | W   | 0.626      | 0.303        | 0.002 (0.000)    | 0.198 (0.037)    | 0 (0.000) |    12.36 | febreeze, hibui, Johan, killerPandas, Magic   |
|           19 |     2250 | 2026-06-12 | NuTorious              | W   | 0.625      | 0.143        | 0.002 (0.000)    | 0.198 (0.018)    | 0 (0.000) |    12.99 | febreeze, hibui, Johan, killerPandas, Magic   |
|           18 |     2277 | 2026-06-11 | Overtake Sector        | L   | 0.620      | -            | -                | -                | -         |    -9.43 | febreeze, hibui, Johan, killerPandas, Magic   |
|           17 |     2380 | 2026-06-06 | Brahmas                | L   | 0.586      | -            | -                | -                | -         |   -11.39 | febreeze, hibui, Johan, killerPandas, Magic   |
|           16 |     2551 | 2026-05-30 | Life's A Game          | L   | 0.538      | -            | -                | -                | -         |    -2.57 | febreeze, hibui, Johan, killerPandas, Magic   |
|           15 |     2556 | 2026-05-30 | NineFly Esports        | W   | 0.538      | 0.294        | 0.000 (0.000)    | 0.000 (0.000)    | 1 (0.538) |     2.74 | febreeze, hibui, Johan, killerPandas, Magic   |
|           14 |     2564 | 2026-05-30 | Reign Above            | L   | 0.537      | -            | -                | -                | -         |   -10.76 | febreeze, hibui, Johan, killerPandas, Magic   |
|           13 |     3664 | 2026-04-28 | Regain                 | L   | 0.326      | -            | -                | -                | -         |    -4.16 | febreeze, hibui, Johan, killerPandas, Magic   |
|           12 |     3705 | 2026-04-27 | EMPIRE (American team) | W   | 0.319      | 0.363        | 0.000 (0.000)    | 0.046 (0.005)    | 0 (0.000) |     4.09 | febreeze, hibui, Johan, killerPandas, Magic   |
|           11 |     3750 | 2026-04-26 | Wildcard               | L   | 0.313      | -            | -                | -                | -         |    -0.88 | febreeze, hibui, Johan, killerPandas, Magic   |
|           10 |     5015 | 2026-03-28 | BOSS                   | L   | 0.119      | -            | -                | -                | -         |    -2.14 | febreeze, JBreezy, Johan, killerPandas, Magic |
|            9 |     5032 | 2026-03-28 | EMPIRE (American team) | W   | 0.118      | 0.354        | 0.000 (0.000)    | 0.046 (0.002)    | 1 (0.118) |     1.53 | febreeze, JBreezy, Johan, killerPandas, Magic |
|            8 |     5050 | 2026-03-28 | Zealous                | W   | 0.117      | 0.354        | 0.000 (0.000)    | 0.000 (0.000)    | 1 (0.117) |     0.59 | febreeze, JBreezy, Johan, killerPandas, Magic |
|            7 |     5065 | 2026-03-28 | EMPIRE (American team) | L   | 0.116      | -            | -                | -                | -         |    -2.17 | febreeze, JBreezy, Johan, killerPandas, Magic |
|            6 |     5297 | 2026-03-23 | NuTorious              | L   | 0.086      | -            | -                | -                | -         |    -0.90 | JBreezy, Johan, killerPandas, LUKE4k, Magic   |
|            5 |     5373 | 2026-03-22 | Zomblers               | W   | 0.080      | 0.363        | 0.006 (0.000)    | 0.211 (0.006)    | 0 (0.000) |     1.16 | JBreezy, Johan, killerPandas, LUKE4k, Magic   |
|            4 |     5419 | 2026-03-21 | FlyQuest RED           | W   | 0.073      | 0.363        | 0.000 (0.000)    | 0.000 (0.000)    | 0 (0.000) |     0.36 | JBreezy, Johan, killerPandas, LUKE4k, Magic   |
|            3 |     5482 | 2026-03-20 | Life's A Game          | L   | 0.066      | -            | -                | -                | -         |    -0.25 | JBreezy, Johan, killerPandas, LUKE4k, Magic   |
|            2 |     5669 | 2026-03-16 | EMPIRE (American team) | L   | 0.039      | -            | -                | -                | -         |    -0.74 | febreeze, JBreezy, Johan, killerPandas, Magic |
|            1 |     5709 | 2026-03-15 | Desi Boyz              | W   | 0.033      | 0.360        | 0.000 (0.000)    | 0.000 (0.000)    | 0 (0.000) |     0.16 | febreeze, JBreezy, Johan, killerPandas, Magic |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($95.78)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-06-14 |      0.639 | $150.00        | $95.78          |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
