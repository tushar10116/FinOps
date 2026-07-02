
String.prototype.isNullOrEmptyString = function(this:string):boolean{
    return !this || this.trim().length===0;
}