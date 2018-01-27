var VerticalSlide = function(cardData){
    console.log(cardData);
    this.verticalSlide = image(cardData.image);
    this.name = titleText(cardData.name);
    this.taglines = text(cardData.taglines);
    this.description = text(cardData.description).hide();
    this.buttonRow = row();
    this.moreButton = buttonCol(6,'More').click(cardData.moreClick);
    this.bookMeetup = buttonCol(6,'Book Meetup').click(cardData.meetupClick);

    return this.verticalSlide.append(
        this.name,
        this.taglines,
        this.description,
        this.buttonRow.append(
            this.bookMeetup,
            this.moreButton,
        )
    )
}
