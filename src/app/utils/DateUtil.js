;
function getFormattedDate(timestamp){
	return moment.unix(timestamp).format("MM/DD/YYYY hh:mm A");
};