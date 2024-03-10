CREATE OR REPLACE FUNCTION assign_user_roomID() RETURNS VOID AS $$
DECLARE
    user_count INTEGER;
    random_value INTEGER;
    user1 RECORD;
    user2 RECORD;
BEGIN
    SELECT COUNT(*) INTO user_count FROM queue WHERE "roomID" IS NULL;

    IF user_count >= 2 THEN
        random_value := (random() * 10000)::INTEGER + 1;

        SELECT * INTO user1 FROM queue WHERE "roomID" IS NULL ORDER BY "arrivalTime" LIMIT 1;
        SELECT * INTO user2 FROM queue WHERE "roomID" IS NULL ORDER BY "arrivalTime" OFFSET 1 LIMIT 1;

        UPDATE queue SET "roomID" = random_value WHERE "userID" = user1."userID";
        UPDATE queue SET "roomID" = random_value WHERE "userID" = user2."userID";
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    -- Call the update_user_field function when a new user is added to the queue
    PERFORM assign_user_roomID();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER queue_trigger
AFTER INSERT ON queue
FOR EACH ROW
EXECUTE FUNCTION trigger_function();

CREATE TRIGGER update_queue_trigger
AFTER UPDATE ON queue
FOR EACH ROW
EXECUTE FUNCTION trigger_function();
