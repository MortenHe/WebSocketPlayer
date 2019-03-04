import { Component, OnInit } from '@angular/core';
import { BackendService } from '../../services/backend.service';
import { FormControl } from '@angular/forms';
import { FileNamePipe } from '../../pipes/file-name.pipe';

@Component({
  selector: 'playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.scss']
})

export class PlaylistComponent implements OnInit {

  //Suchfeld fuer Playlist
  playlistFilterInput: FormControl = new FormControl("");

  //aktuelle Zeit des laufenden Items
  time: string = "";

  //Liste der Dateien, die abgespielt werden
  files: any[] = [];

  //aktueller Index in Titelliste
  position: number;

  //temp. Wert, wohin gerade gesprungen werden soll
  jumpPosition: number = -1;

  //In welchem Modus sind wir (hsp, cds, musik)
  mode: string;

  //Service injecten
  constructor(private bs: BackendService) { }

  //beim Init
  ngOnInit() {

    //akutelle Zeit per Service abbonieren und in Variable schreiben
    this.bs.getTime().subscribe(time => this.time = time);

    //Liste des aktuellen per Service abbonieren und in Variable schreiben
    this.bs.getFiles().subscribe(files => {

      //Suchfeld fuer Playlist leeren
      this.playlistFilterInput.setValue("");

      //Dateien kommen mit ganzem Pfad -> per Pipe auf echten Dateinamen reduzieren, sammeln und daraus Liste fuer Anzeige erzeugen
      let fileNamePipe = new FileNamePipe();
      let fileNamesClean = [];
      for (let file of files) {
        let fileNameClean = fileNamePipe.transform(file);
        fileNamesClean.push(fileNameClean);
      }
      this.files = fileNamesClean;
    });

    //Mode abbonieren
    this.bs.getMode().subscribe(mode => {
      this.mode = mode;
    });

    //aktuellen Index in Titelliste abbonieren und in Variable schreiben (fuer CSS-Klasse)
    this.bs.getPosition().subscribe(position => {
      this.position = position;

      //temp. Sprungwert (fuer optische Darstellung) wieder zuruecksetzen
      this.jumpPosition = -1;
    });
  }

  //zu gewissem Titel in Playlist springen
  jumpTo(position: number) {

    //Befehl an WSS schicken
    this.bs.sendMessage({ type: "jump-to", value: position });

    //Wenn zu einem anderen Titel gesprungen werden soll
    if (this.position !== position) {

      //bei diesem Eintrag einen Spinner anzeigen, bis der Titel geladen wurde
      this.jumpPosition = position;
    }
  }
}