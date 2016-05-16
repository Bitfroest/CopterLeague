import { Injectable }     from '@angular/core';
import { Http, Response } from '@angular/http';

import { Pilot }          from './pilot';
import { Observable }     from 'rxjs/Observable';
import 'rxjs/Rx';

@Injectable()
export class PilotService {
	constructor (private http: Http) {}

	private pilotsUrl = 'api/pilot';  // URL to web API

	getPilots (): Observable<Pilot[]> {
		console.log('getPilots');
		return this.http.get(this.pilotsUrl)
					.map(this.extractData)
					.catch(this.handleError);
	}
	getPilot(id: number) {
		return this.http.get(this.pilotsUrl + '/'+id)
					.map(this.extractData)
					.catch(this.handleError);
	}
	private extractData(res: Response) {
		if (res.status < 200 || res.status >= 300) {
			throw new Error('Response status: ' + res.status);
		}
		let body = res.json();
		console.log(body);
		return body || [];
	}
	private handleError (error: any) {
		// In a real world app, we might use a remote logging infrastructure
		let errMsg = error.message || 'Server error';
		console.error(errMsg); // log to console instead
		return Observable.throw(errMsg);
	}
}
