export namespace api {
	
	export class ReloadRequest {
	    music_dirs: string[];
	    wampy_dir: string;
	
	    static createFrom(source: any = {}) {
	        return new ReloadRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.music_dirs = source["music_dirs"];
	        this.wampy_dir = source["wampy_dir"];
	    }
	}

}

