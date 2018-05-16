import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { forkJoin } from "rxjs/observable/forkJoin";
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import * as path from 'path'
import 'rxjs/add/operator/finally';

@Injectable()
export class JsondataService {

  //Service injecten
  constructor(private http: Http) { }

  //JSON-Daten aus files laden
  loadJson(appMode) {

    //per HTTP JSON Hauptfile holen (audiolist.json vs. videolist.json)
    return this.http.get("assets/json/" + appMode + "/" + appMode + "list.json").map(data => {

      //JSON-Objekt laden. Dieses wird angepasst (gewisse Merkmale entfernt, items einfgefuegt)
      let jsonObj = data.json();

      //ForkJoin Array, damit auslesen der einzelnen Unter-JSONs (bibi-tina.json, bobo.json) parallel erfolgen kann
      let modeDataFileArr: Observable<any>[] = [];

      //Ueber Modes gehen (htp, kindermusik, musikmh)
      for (let [mode, modeData] of Object.entries(jsonObj)) {

        //merken, welche Filter geloescht werden sollen
        let inactiveFilters = [];

        //Ueber Filter des Modus gehen (bibi-tina, bobo,...)
        modeData["filter"].forEach((filterData, index) => {

          //filterID merken (bibi-tina, bobo)
          let filterID = filterData["id"];

          //All-Filter wird immer angezeigt
          if (filterID !== "all") {

            //Wenn Modus aktiv ist
            if (filterData["active"]) {

              //Feld "active" loeschen (wird nicht fuer die Oberflaeche benoetigt)
              delete jsonObj[mode]["filter"][index]["active"];

              //Request erstellen, der JSON dieses Filters holt (z.B. bibi-tina.json)
              let request = this.http.get("assets/json/" + appMode + "/" + mode + "/" + filterID + ".json").map(response => {

                //Modus (hsp) und filterID (bibi-tina) merken, da Info sonst spaeter ueberschrieben wurde
                let mode = path.dirname(response.url);
                let filterID = path.basename(response.url, '.json');

                //Ergebnis des Reqeusts als JSON + weitere Parameter weiterreichen
                return { data: response.json(), filterID: filterID, mode: path.basename(mode) };
              });

              //Request sammeln -> werden spaeter per forkjoin ausgefuehrt
              modeDataFileArr.push(request);
            }

            //Filter (und die zugehoerigen Dateien) sollen nicht sichtbar sein
            else {

              //Filter sammeln -> wird spaeter geloescht
              inactiveFilters.push(filterData);
            }
          }

          //"all" Filter
          else {

            //Feld "active" loeschen
            delete jsonObj[mode]["filter"][index]["active"];
          }
        });

        //Ueber inaktive Filter gehen
        inactiveFilters.forEach(filter => {

          //Position in Array ermitteln
          let filterIndex = jsonObj[mode]["filter"].indexOf(filter)

          //Filter aus Array loeschen
          jsonObj[mode]["filter"].splice(filterIndex, 1);
        });
      }

      //ForkJoin fuer verschiedene Reqeusts ausfuehren
      return forkJoin(modeDataFileArr).map(results => {

        //Ueber die Treffer (JSON-files) gehen
        results.forEach((result, index) => {

          //Ueber Daten (z.B. einzelne Audio-Playlists) gehen
          result["data"].forEach(modeItem => {

            //Wenn Playlist / Video ist
            if (modeItem["active"]) {

              //Feld "active" loeschen
              delete modeItem["active"];

              //Modus einfuegen (damit Filterung in Oberflaeche geht)
              modeItem["mode"] = result["filterID"];

              //Playlist- / Video-Objekt in Ausgabe Objekt einfuegen
              jsonObj[result["mode"]]["items"].push(modeItem);
            }
          });
        });

        //Daten-Objekt zurueckliefern
        return jsonObj;
      });
    });
  }
}